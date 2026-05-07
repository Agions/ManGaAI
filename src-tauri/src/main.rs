// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;
use serde::{Deserialize, Serialize};
use tauri::command;
use std::fs::{self, File};
use std::io::Write;
use tauri::Manager;
use std::ffi::OsStr;
use std::collections::HashMap;
use std::path::PathBuf;

/// Execute ffmpeg directly without shell to prevent command injection.
fn run_ffmpeg(args: &[&str]) -> Result<(), String> {
    let output = Command::new("ffmpeg")
        .args(args)
        .output()
        .map_err(|e| format!("执行FFmpeg命令失败: {}", e))?;
    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFmpeg错误: {}", err));
    }
    Ok(())
}

fn run_ffmpeg_vec(args: &[String]) -> Result<(), String> {
    let output = Command::new("ffmpeg")
        .args(args.iter().map(|s| s.as_ref()).collect::<Vec<&OsStr>>())
        .output()
        .map_err(|e| format!("执行FFmpeg命令失败: {}", e))?;
    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFmpeg错误: {}", err));
    }
    Ok(())
}

/// Validate path is inside an allowed temp directory using canonical paths
fn validate_temp_path(path: &str) -> Result<PathBuf, String> {
    let allowed_dirs = [
        std::env::temp_dir().join("mangaai"),
        std::env::temp_dir().join("mangaai_temp"),
        std::env::temp_dir().join("mangaai_keyframes"),
        std::env::temp_dir().join("mangaai_thumbnails"),
        std::env::temp_dir().join("mangaai_preview"),
    ];
    let file_path = PathBuf::from(path);
    let canonical_path = file_path.canonicalize().map_err(|e| {
        format!("路径无效: {}", e)
    })?;
    let is_allowed = allowed_dirs.iter().any(|allowed| {
        canonical_path.starts_with(allowed)
    });
    if !is_allowed {
        return Err("无效的临时文件路径".into());
    }
    Ok(canonical_path)
}

#[derive(Serialize, Deserialize, Debug)]
struct VideoMetadata {
    duration: f64,
    width: u32,
    height: u32,
    fps: f64,
    codec: String,
    bitrate: u32,
}

#[derive(Deserialize, Debug)]
struct VideoSegment {
    start: f64,
    end: f64,
    #[serde(rename = "type")]
    segment_type: Option<String>,
    content: Option<String>,
}

#[derive(Deserialize, Debug)]
struct CutVideoParams {
    input_path: String,
    output_path: String,
    segments: Vec<VideoSegment>,
    quality: Option<String>,
    format: Option<String>,
    transition: Option<String>,
    transition_duration: Option<f64>,
    volume: Option<f64>,
    add_subtitles: Option<bool>,
}

#[derive(Deserialize, Debug)]
struct PreviewParams {
    input_path: String,
    segment: VideoSegment,
    transition: Option<String>,
    transition_duration: Option<f64>,
    volume: Option<f64>,
    add_subtitles: Option<bool>,
}

#[derive(Deserialize, Debug)]
struct CleanFileParams {
    path: String,
}

#[command]
fn analyze_video(path: String) -> Result<VideoMetadata, String> {
    println!("分析视频: {}", path);
    
    if !is_ffmpeg_installed() {
        return Err("未安装FFmpeg，请先安装FFmpeg后再试".into());
    }
    
    let output = Command::new("ffprobe")
        .args(&[
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            &path
        ])
        .output()
        .map_err(|e| format!("运行ffprobe失败: {}", e))?;
    
    if !output.status.success() {
        return Err(format!("ffprobe命令执行失败: {}", String::from_utf8_lossy(&output.stderr)));
    }
    
    let json_output = String::from_utf8_lossy(&output.stdout);
    let json_value: serde_json::Value = serde_json::from_str(&json_output)
        .map_err(|e| format!("解析JSON失败: {}", e))?;
    
    let streams = json_value["streams"].as_array().ok_or("无法获取视频流信息")?;
    let video_stream = streams.iter()
        .find(|s| s["codec_type"].as_str().unwrap_or("") == "video")
        .ok_or("未找到视频流")?;
    
    let width = video_stream["width"].as_u64().unwrap_or(0) as u32;
    let height = video_stream["height"].as_u64().unwrap_or(0) as u32;
    
    let fps_str = video_stream["r_frame_rate"].as_str().unwrap_or("0/1");
    let fps = parse_fps(fps_str);
    
    let codec = video_stream["codec_name"].as_str().unwrap_or("unknown").to_string();
    
    let format = &json_value["format"];
    let duration = format["duration"].as_str().unwrap_or("0")
        .parse::<f64>().unwrap_or(0.0);
    
    let bitrate = format["bit_rate"].as_str().unwrap_or("0")
        .parse::<u32>().unwrap_or(0);
    
    Ok(VideoMetadata {
        duration,
        width,
        height,
        fps,
        codec,
        bitrate,
    })
}

#[command]
fn extract_key_frames(path: String, count: u32) -> Result<Vec<String>, String> {
    println!("提取关键帧: {}, 数量: {}", path, count);
    
    if !is_ffmpeg_installed() {
        return Err("未安装FFmpeg，请先安装FFmpeg后再试".into());
    }
    
    let metadata = analyze_video(path.clone())?;
    let duration = metadata.duration;
    
    let temp_dir = std::env::temp_dir().join("blazecut_keyframes");
    fs::create_dir_all(&temp_dir).map_err(|e| format!("创建临时目录失败: {}", e))?;
    
    let mut frame_positions = Vec::new();
    let segment = duration / (count as f64 + 1.0);
    
    for i in 1..=count {
        let position = segment * (i as f64);
        frame_positions.push(position);
    }
    
    let mut frame_paths = Vec::new();
    
    for (i, &position) in frame_positions.iter().enumerate() {
        let output_path = temp_dir.join(format!("frame_{}.jpg", i+1));
        let output_str = output_path.to_str().ok_or("路径转换失败")?;
        
        let status = Command::new("ffmpeg")
            .args(&[
                "-ss", &format!("{}", position),
                "-i", &path,
                "-vframes", "1",
                "-q:v", "2",
                "-f", "image2",
                output_str
            ])
            .status()
            .map_err(|e| format!("运行ffmpeg失败: {}", e))?;
        
        if !status.success() {
            return Err("提取帧失败".into());
        }
        
        frame_paths.push(output_str.to_string());
    }
    
    Ok(frame_paths)
}

#[command]
fn generate_thumbnail(path: String) -> Result<String, String> {
    println!("生成缩略图: {}", path);
    
    if !is_ffmpeg_installed() {
        return Err("未安装FFmpeg，请先安装FFmpeg后再试".into());
    }
    
    let temp_dir = std::env::temp_dir().join("blazecut_thumbnails");
    fs::create_dir_all(&temp_dir).map_err(|e| format!("创建临时目录失败: {}", e))?;
    
    let thumbnail_path = temp_dir.join(format!("thumb_{}.jpg", random_id()));
    let thumbnail_str = thumbnail_path.to_str().ok_or("路径转换失败")?;
    
    let status = Command::new("ffmpeg")
        .args(&[
            "-ss", "15%",
            "-i", &path,
            "-vframes", "1",
            "-vf", "scale=320:-1",
            "-q:v", "2",
            "-f", "image2",
            thumbnail_str
        ])
        .status()
        .map_err(|e| format!("运行ffmpeg失败: {}", e))?;
    
    if !status.success() {
        return Err("生成缩略图失败".into());
    }
    
    Ok(thumbnail_str.to_string())
}

#[command]
fn check_app_data_directory(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_data_dir = app_handle.path().app_data_dir()
        .map_err(|e| format!("无法获取应用数据目录: {}", e))?;

    let app_dir = app_data_dir.join("blazecut");
    
    if !app_dir.exists() {
        match fs::create_dir_all(&app_dir) {
            Ok(_) => (),
            Err(e) => return Err(format!("创建目录失败: {}", e)),
        }
    }

    Ok(app_dir.to_string_lossy().into_owned())
}

#[command]
fn save_project_file(project_id: String, content: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    let app_data_dir = app_handle.path().app_data_dir()
        .map_err(|e| format!("无法获取应用数据目录: {}", e))?;

    let app_dir = app_data_dir.join("blazecut");
    
    if !app_dir.exists() {
        match fs::create_dir_all(&app_dir) {
            Ok(_) => (),
            Err(e) => return Err(format!("创建目录失败: {}", e)),
        }
    }

    let file_path = app_dir.join(format!("{}.json", project_id));
    
    let mut file = match File::create(&file_path) {
        Ok(file) => file,
        Err(e) => return Err(format!("创建文件失败: {}", e)),
    };

    match file.write_all(content.as_bytes()) {
        Ok(_) => (),
        Err(e) => return Err(format!("写入文件失败: {}", e)),
    }

    if !file_path.exists() {
        return Err("文件写入后无法确认其存在".into());
    }

    Ok(())
}

#[tauri::command]
async fn cut_video(params: CutVideoParams, window: tauri::Window) -> Result<String, String> {
    println!("开始剪辑视频: {:?}", params);
    
    if !is_ffmpeg_installed() {
        return Err("未安装FFmpeg，请先安装FFmpeg后再试".into());
    }
    
    let temp_dir = std::env::temp_dir().join("blazecut_temp");
    fs::create_dir_all(&temp_dir).map_err(|e| format!("创建临时目录失败: {}", e))?;
    
    let format = params.format.unwrap_or_else(|| "mp4".to_string());
    let quality = params.quality.unwrap_or_else(|| "medium".to_string());
    
    let (video_codec, video_params) = match format.as_str() {
        "mp4" | "mov" => {
            let params = match quality.as_str() {
                "low" => "-vf scale=1280:720 -b:v 1.5M -preset fast",
                "medium" => "-vf scale=1920:1080 -b:v 4M -preset fast",
                "high" => "-b:v 8M -preset slow",
                "ultra" => "-b:v 15M -preset slow",
                _ => "-vf scale=1920:1080 -b:v 4M -preset fast",
            };
            ("libx264".to_string(), params.to_string())
        },
        "webm" => {
            let params = match quality.as_str() {
                "low" => "-vf scale=1280:720 -b:v 1M",
                "medium" => "-vf scale=1920:1080 -b:v 3M",
                "high" => "-b:v 6M",
                "ultra" => "-b:v 10M",
                _ => "-vf scale=1920:1080 -b:v 3M",
            };
            ("libvpx-vp9".to_string(), params.to_string())
        },
        _ => {
            let params = match quality.as_str() {
                "low" => "-vf scale=1280:720 -b:v 1.5M",
                "medium" => "-vf scale=1920:1080 -b:v 4M",
                "high" => "-b:v 8M",
                "ultra" => "-b:v 15M",
                _ => "-vf scale=1920:1080 -b:v 4M",
            };
            ("libx264".to_string(), params.to_string())
        }
    };
    
    let transition_type = params.transition.unwrap_or_else(|| "none".to_string());
    let transition_duration = params.transition_duration.unwrap_or(1.0);
    let volume = params.volume.unwrap_or(1.0);
    let add_subtitles = params.add_subtitles.unwrap_or(false);
    
    if params.segments.is_empty() {
        return Err("没有提供有效的片段信息".into());
    }
    
    let mut segment_files = Vec::new();
    let mut subtitle_files = Vec::new();
    
    for (i, segment) in params.segments.iter().enumerate() {
        if segment.end <= segment.start {
            println!("忽略无效片段: {:?}", segment);
            continue;
        }
        
        let duration = segment.end - segment.start;
        let segment_file = temp_dir.join(format!("segment_{}.{}", i, format));
        let segment_path = segment_file.to_string_lossy().to_string();
        
        let mut video_filters = String::new();
        
        if (volume - 1.0).abs() > 0.01 {
            if !video_filters.is_empty() {
                video_filters.push_str(",");
            }
            video_filters.push_str(&format!("volume={}", volume));
        }
        
        if add_subtitles && segment.content.is_some() {
            let subtitle_file = temp_dir.join(format!("subtitle_{}.srt", i));
            let subtitle_path = subtitle_file.to_string_lossy().to_string();
            subtitle_files.push(subtitle_path.clone());
            
            let mut file = File::create(&subtitle_file)
                .map_err(|e| format!("创建字幕文件失败: {}", e))?;
            
            writeln!(file, "1")
                .map_err(|e| format!("写入字幕失败: {}", e))?;
            writeln!(file, "00:00:00,000 --> 00:{:02}:{:02},000", 
                (duration as u32) / 60, (duration as u32) % 60)
                .map_err(|e| format!("写入字幕失败: {}", e))?;
            writeln!(file, "{}", segment.content.as_ref().unwrap())
                .map_err(|e| format!("写入字幕失败: {}", e))?;
            
            if !video_filters.is_empty() {
                video_filters.push_str(",");
            }
            video_filters.push_str(&format!("subtitles='{}'", subtitle_path));
        }
        
        let mut ffmpeg_args: Vec<String> = vec![
            "-y".to_string(),
            "-ss".to_string(),
            segment.start.to_string(),
            "-i".to_string(),
            params.input_path.clone(),
            "-t".to_string(),
            duration.to_string(),
        ];
        for arg in video_params.split_whitespace() {
            ffmpeg_args.push(arg.to_string());
        }
        ffmpeg_args.extend(["-c:v".to_string(), video_codec.clone()]);
        if !video_filters.is_empty() {
            ffmpeg_args.extend(["-vf".to_string(), video_filters.clone()]);
        }
        ffmpeg_args.extend(["-c:a".to_string(), "aac".to_string(), "-strict".to_string(), "experimental".to_string(), segment_path.clone()]);

        println!("执行FFmpeg命令: {:?}", ffmpeg_args);
        run_ffmpeg_vec(&ffmpeg_args)?;

        segment_files.push(segment_path);
    }
    
    if transition_type != "none" && segment_files.len() > 1 {
        let mut transition_files = Vec::new();
        
        for i in 0..segment_files.len() - 1 {
            let file1 = &segment_files[i];
            let file2 = &segment_files[i + 1];
            let transition_file = temp_dir.join(format!("transition_{}_{}.{}", i, i+1, format));
            let transition_path = transition_file.to_string_lossy().to_string();
            
            let filter_complex = match transition_type.as_str() {
                "fade" => format!(
                    "[0:v]format=pix_fmts=yuva420p,fade=t=out:st={}:d={}:alpha=1[fv1];[1:v]format=pix_fmts=yuva420p,fade=t=in:st=0:d={}:alpha=1[fv2];[fv1][fv2]overlay=format=yuv420[outv]",
                    transition_duration, transition_duration, transition_duration
                ),
                "dissolve" => format!(
                    "[0:v][1:v]xfade=transition=fade:duration={}:offset={}[outv]",
                    transition_duration, 5.0
                ),
                "wipe" => format!(
                    "[0:v][1:v]xfade=transition=wiperight:duration={}:offset={}[outv]",
                    transition_duration, 5.0
                ),
                "slide" => format!(
                    "[0:v][1:v]xfade=transition=slideleft:duration={}:offset={}[outv]",
                    transition_duration, 5.0
                ),
                _ => "[0:v][1:v]concat=n=2:v=1:a=0[outv]".to_string(),
            };

            println!("执行转场命令: {:?}", (file1, file2, &filter_complex, &transition_path));
            run_ffmpeg(&[
                "-y", "-i", file1, "-i", file2,
                "-filter_complex", &filter_complex,
                "-map", "[outv]",
                &transition_path,
            ])?;

            transition_files.push(transition_path);
        }
        
        segment_files = transition_files;
    }
    
    let list_file = temp_dir.join("segments.txt");
    let mut file = fs::File::create(&list_file)
        .map_err(|e| format!("创建片段列表文件失败: {}", e))?;
    
    for segment_path in &segment_files {
        writeln!(file, "file '{}'", segment_path)
            .map_err(|e| format!("写入片段列表失败: {}", e))?;
    }
    
    let list_file_str = list_file.to_string_lossy().to_string();
    let output_path_str = params.output_path.to_string();
    let (out_vcodec, out_acodec) = match format.as_str() {
        "mp4" | "mov" => ("libx264", "aac"),
        "webm" => ("libvpx-vp9", "libopus"),
        _ => ("libx264", "aac"),
    };

    println!("执行连接命令: list_file={}, output={}", list_file_str, output_path_str);
    run_ffmpeg(&[
        "-y", "-f", "concat", "-safe", "0", "-i", &list_file_str,
        "-c:v", out_vcodec, "-c:a", out_acodec, "-strict", "-2",
        &output_path_str,
    ])?;
    
    
    for segment_path in segment_files {
        fs::remove_file(segment_path).unwrap_or_default();
    }
    for subtitle_path in subtitle_files {
        fs::remove_file(subtitle_path).unwrap_or_default();
    }
    fs::remove_file(list_file).unwrap_or_default();
    
    Ok(params.output_path)
}

#[tauri::command]
async fn generate_preview(params: PreviewParams) -> Result<String, String> {
    println!("生成预览片段: {:?}", params);
    
    if !is_ffmpeg_installed() {
        return Err("未安装FFmpeg，请先安装FFmpeg后再试".into());
    }
    
    let temp_dir = std::env::temp_dir().join("blazecut_preview");
    fs::create_dir_all(&temp_dir).map_err(|e| format!("创建临时目录失败: {}", e))?;
    
    let preview_file = temp_dir.join(format!("preview_{}.mp4", random_id()));
    let preview_path = preview_file.to_string_lossy().to_string();
    
    if params.segment.end <= params.segment.start {
        return Err("无效的片段时间范围".into());
    }
    
    let duration = params.segment.end - params.segment.start;
    
    let volume = params.volume.unwrap_or(1.0);
    let volume_filter = if (volume - 1.0).abs() > 0.01 {
        format!(",volume={}", volume)
    } else {
        "".to_string()
    };
    
    let add_subtitles = params.add_subtitles.unwrap_or(false);
    let subtitle_filter = if add_subtitles {
        if let Some(content) = &params.segment.segment_type {
            let subtitle_file = temp_dir.join(format!("subtitle_{}.srt", random_id()));
            let mut file = File::create(&subtitle_file)
                .map_err(|e| format!("创建字幕文件失败: {}", e))?;
            
            writeln!(file, "1")
                .map_err(|e| format!("写入字幕失败: {}", e))?;
            writeln!(file, "00:00:00,000 --> 00:{:02}:{:02},000", 
                (duration as u32) / 60, (duration as u32) % 60)
                .map_err(|e| format!("写入字幕失败: {}", e))?;
            writeln!(file, "{}", content)
                .map_err(|e| format!("写入字幕失败: {}", e))?;
            
            format!(",subtitles='{}'", subtitle_file.to_string_lossy())
        } else {
            "".to_string()
        }
    } else {
        "".to_string()
    };
    
    let video_filters = format!("scale=1280:720{}{}", volume_filter, subtitle_filter);
    let preview_path_str = preview_path.to_string();

    println!("执行预览命令: start={}, input={}, duration={}, filters={}",
             params.segment.start, params.input_path, duration, video_filters);
    run_ffmpeg(&[
        "-y",
        "-ss", &params.segment.start.to_string(),
        "-i", &params.input_path,
        "-t", &duration.to_string(),
        "-vf", &video_filters,
        "-c:v", "libx264",
        "-c:a", "aac",
        "-strict", "experimental",
        &preview_path_str,
    ])?;

    Ok(preview_path)
}

#[tauri::command]
fn clean_temp_file(params: CleanFileParams) -> Result<(), String> {
    println!("清理临时文件: {}", params.path);
    let canonical = validate_temp_path(&params.path)?;
    if canonical.is_file() {
        fs::remove_file(&canonical).map_err(|e| format!("删除文件失败: {}", e))?;
    }
    Ok(())
}

#[command]
fn list_app_data_files(directory: String, app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    let app_data_dir = app_handle.path().app_data_dir()
        .map_err(|e| format!("无法获取应用数据目录: {}", e))?;

    let target_dir = app_data_dir.join(directory);
    
    if !target_dir.exists() {
        match fs::create_dir_all(&target_dir) {
            Ok(_) => (),
            Err(e) => return Err(format!("创建目录失败: {}", e)),
        }
    }

    let entries = match fs::read_dir(&target_dir) {
        Ok(entries) => entries,
        Err(e) => return Err(format!("读取目录失败: {}", e)),
    };

    let mut files = Vec::new();
    for entry in entries {
        match entry {
            Ok(entry) => {
                if let Some(file_name) = entry.file_name().to_str() {
                    files.push(file_name.to_string());
                }
            },
            Err(e) => return Err(format!("读取目录项失败: {}", e)),
        }
    }

    Ok(files)
}

#[command]
fn delete_project_file(project_id: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    let app_data_dir = app_handle.path().app_data_dir()
        .map_err(|e| format!("无法获取应用数据目录: {}", e))?;

    let file_path = app_data_dir.join("blazecut").join(format!("{}.json", project_id));
    
    if !file_path.exists() {
        return Err(format!("项目文件不存在: {}", file_path.display()));
    }

    match fs::remove_file(&file_path) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("删除文件失败: {}", e)),
    }
}

#[command]
fn remove_file(path: String) -> Result<(), String> {
    // Restrict to allowed temp directories to prevent arbitrary file deletion
    let canonical = validate_temp_path(&path)?;
    match fs::remove_file(&canonical) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("删除文件失败: {}", e)),
    }
}

#[command]
fn open_file(path: String) -> Result<(), String> {
    use std::process::Command;
    
    #[cfg(target_os = "windows")]
    {
        let status = Command::new("cmd")
            .args(&["/C", "start", "", &path])
            .status()
            .map_err(|e| format!("无法执行命令: {}", e))?;
        if !status.success() {
            return Err("无法打开文件".into());
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        let status = Command::new("open")
            .arg(&path)
            .status()
            .map_err(|e| format!("无法执行命令: {}", e))?;
        if !status.success() {
            return Err("无法打开文件".into());
        }
    }
    
    #[cfg(target_os = "linux")]
    {
        let status = Command::new("xdg-open")
            .arg(&path)
            .status()
            .map_err(|e| format!("无法执行命令: {}", e))?;
        if !status.success() {
            return Err("无法打开文件".into());
        }
    }
    
    Ok(())
}

fn is_ffmpeg_installed() -> bool {
    let ffmpeg = Command::new("ffmpeg")
        .arg("-version")
        .output();
    
    let ffprobe = Command::new("ffprobe")
        .arg("-version")
        .output();
    
    ffmpeg.is_ok() && ffprobe.is_ok()
}

#[tauri::command]
fn check_ffmpeg() -> Result<HashMap<String, serde_json::Value>, String> {
    let mut result = HashMap::new();
    
    let is_installed = is_ffmpeg_installed();
    result.insert("installed".to_string(), serde_json::Value::Bool(is_installed));
    
    if is_installed {
        if let Ok(output) = Command::new("ffmpeg")
            .arg("-version")
            .output() {
            if output.status.success() {
                let version_str = String::from_utf8_lossy(&output.stdout);
                let first_line = version_str.lines().next().unwrap_or("");
                result.insert("version".to_string(), serde_json::Value::String(first_line.to_string()));
            }
        }
    }
    
    Ok(result)
}

fn parse_fps(fps_str: &str) -> f64 {
    let parts: Vec<&str> = fps_str.split('/').collect();
    if parts.len() == 2 {
        let numerator = parts[0].parse::<f64>().unwrap_or(0.0);
        let denominator = parts[1].parse::<f64>().unwrap_or(1.0);
        if denominator > 0.0 {
            return numerator / denominator;
        }
    }
    0.0
}

fn random_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    format!("{}", now)
}

fn main() {
    println!("启动 ManGa AI 应用");
    
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::default().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|_app| {
            println!("应用设置初始化");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            analyze_video,
            extract_key_frames,
            generate_thumbnail,
            check_app_data_directory,
            save_project_file,
            list_app_data_files,
            delete_project_file,
            remove_file,
            open_file,
            cut_video,
            generate_preview,
            clean_temp_file,
            check_ffmpeg
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
