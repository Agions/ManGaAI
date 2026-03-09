use tauri::Manager;
use log::{info, error};
use std::process::Command;
use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::Write;
use std::collections::HashMap;
use std::sync::Mutex;
use std::path::PathBuf;

// 视频元数据
#[derive(Serialize, Deserialize, Debug)]
struct VideoMetadata {
    duration: f64,
    width: u32,
    height: u32,
    fps: f64,
    codec: String,
    bitrate: u32,
}

// 视频剪辑片段结构
#[derive(Deserialize, Debug)]
struct VideoSegment {
    start: f64,
    end: f64,
    #[serde(rename = "type")]
    segment_type: Option<String>,
    content: Option<String>,
}

// 视频剪辑参数
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

// 预览片段参数
#[derive(Deserialize, Debug)]
struct PreviewParams {
    input_path: String,
    segment: VideoSegment,
    transition: Option<String>,
    transition_duration: Option<f64>,
    volume: Option<f64>,
    add_subtitles: Option<bool>,
}

// 清理临时文件参数
#[derive(Deserialize, Debug)]
struct CleanFileParams {
    path: String,
}

/// 分析视频文件获取元数据
#[tauri::command]
fn analyze_video(path: String) -> Result<VideoMetadata, String> {
    info!("分析视频: {}", path);

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

/// 从视频中提取关键帧
#[tauri::command]
fn extract_key_frames(path: String, count: u32) -> Result<Vec<String>, String> {
    info!("提取关键帧: {}, 数量: {}", path, count);

    if !is_ffmpeg_installed() {
        return Err("未安装FFmpeg，请先安装FFmpeg后再试".into());
    }

    let metadata = analyze_video(path.clone())?;
    let duration = metadata.duration;

    let temp_dir = std::env::temp_dir().join("mangaai_keyframes");
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

/// 生成视频缩略图
#[tauri::command]
fn generate_thumbnail(path: String) -> Result<String, String> {
    info!("生成缩略图: {}", path);

    if !is_ffmpeg_installed() {
        return Err("未安装FFmpeg，请先安装FFmpeg后再试".into());
    }

    let temp_dir = std::env::temp_dir().join("mangaai_thumbnails");
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

/// 剪辑视频 - 支持多段剪辑和转场效果
#[tauri::command]
async fn cut_video(params: CutVideoParams, window: tauri::Window) -> Result<String, String> {
    info!("开始剪辑视频: {:?}", params);

    if !is_ffmpeg_installed() {
        return Err("未安装FFmpeg，请先安装FFmpeg后再试".into());
    }

    let temp_dir = std::env::temp_dir().join("mangaai_temp");
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
            info!("忽略无效片段: {:?}", segment);
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

        let filter_param = if !video_filters.is_empty() {
            format!("-vf \"{}\"", video_filters)
        } else {
            String::new()
        };

        let ffmpeg_command = format!(
            "ffmpeg -y -ss {} -i \"{}\" -t {} {} -c:v {} {} -c:a aac -strict experimental \"{}\"",
            segment.start,
            params.input_path,
            duration,
            video_params,
            filter_param,
            video_codec,
            segment_path
        );

        let _ = window.emit("cut_progress", i as f64 / params.segments.len() as f64 * 0.6);

        info!("执行FFmpeg命令: {}", ffmpeg_command);
        let output = Command::new("sh")
            .arg("-c")
            .arg(&ffmpeg_command)
            .output()
            .map_err(|e| format!("执行FFmpeg命令失败: {}", e))?;

        if !output.status.success() {
            let err = String::from_utf8_lossy(&output.stderr);
            error!("FFmpeg错误: {}", err);
            return Err(format!("剪辑片段失败: {}", err));
        }

        segment_files.push(segment_path);
    }

    // 处理转场效果
    if transition_type != "none" && segment_files.len() > 1 {
        let mut transition_files = Vec::new();
        let _ = window.emit("cut_progress", 0.7);

        for i in 0..segment_files.len() - 1 {
            let file1 = &segment_files[i];
            let file2 = &segment_files[i + 1];
            let transition_file = temp_dir.join(format!("transition_{}_{}.{}", i, i+1, format));
            let transition_path = transition_file.to_string_lossy().to_string();

            let transition_command = match transition_type.as_str() {
                "fade" => format!(
                    "ffmpeg -y -i \"{}\" -i \"{}\" -filter_complex \"[0:v]format=pix_fmts=yuva420p,fade=t=out:st={}:d={}:alpha=1[fv1];[1:v]format=pix_fmts=yuva420p,fade=t=in:st=0:d={}:alpha=1[fv2];[fv1][fv2]overlay=format=yuv420[outv]\" -map \"[outv]\" \"{}\"",
                    file1, file2,
                    transition_duration, transition_duration, transition_duration,
                    transition_path
                ),
                "dissolve" => format!(
                    "ffmpeg -y -i \"{}\" -i \"{}\" -filter_complex \"[0:v][1:v]xfade=transition=fade:duration={}:offset={}[outv]\" -map \"[outv]\" \"{}\"",
                    file1, file2,
                    transition_duration, 5.0,
                    transition_path
                ),
                "wipe" => format!(
                    "ffmpeg -y -i \"{}\" -i \"{}\" -filter_complex \"[0:v][1:v]xfade=transition=wiperight:duration={}:offset={}[outv]\" -map \"[outv]\" \"{}\"",
                    file1, file2,
                    transition_duration, 5.0,
                    transition_path
                ),
                "slide" => format!(
                    "ffmpeg -y -i \"{}\" -i \"{}\" -filter_complex \"[0:v][1:v]xfade=transition=slideleft:duration={}:offset={}[outv]\" -map \"[outv]\" \"{}\"",
                    file1, file2,
                    transition_duration, 5.0,
                    transition_path
                ),
                _ => format!(
                    "ffmpeg -y -i \"{}\" -i \"{}\" -filter_complex \"[0:v][1:v]concat=n=2:v=1:a=0[outv]\" -map \"[outv]\" \"{}\"",
                    file1, file2,
                    transition_path
                ),
            };

            info!("执行转场命令: {}", transition_command);
            let output = Command::new("sh")
                .arg("-c")
                .arg(&transition_command)
                .output()
                .map_err(|e| format!("执行FFmpeg转场命令失败: {}", e))?;

            if !output.status.success() {
                let err = String::from_utf8_lossy(&output.stderr);
                error!("FFmpeg错误: {}", err);
                return Err(format!("创建转场失败: {}", err));
            }

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

    let (output_video_codec, output_audio_codec) = if format == "webm" {
        ("libvpx-vp9", "libopus")
    } else {
        ("libx264", "aac")
    };

    let concat_command = format!(
        "ffmpeg -y -f concat -safe 0 -i \"{}\" -c:v {} -c:a {} -strict -2 \"{}\"",
        list_file.to_string_lossy(),
        output_video_codec,
        output_audio_codec,
        params.output_path
    );

    let _ = window.emit("cut_progress", 0.9);

    info!("执行连接命令: {}", concat_command);
    let output = Command::new("sh")
        .arg("-c")
        .arg(&concat_command)
        .output()
        .map_err(|e| format!("执行FFmpeg连接命令失败: {}", e))?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        error!("FFmpeg错误: {}", err);
        return Err(format!("连接片段失败: {}", err));
    }

    let _ = window.emit("cut_progress", 1.0);

    for segment_path in segment_files {
        let _ = fs::remove_file(segment_path);
    }
    for subtitle_path in subtitle_files {
        let _ = fs::remove_file(subtitle_path);
    }
    let _ = fs::remove_file(list_file);

    info!("视频剪辑完成: {}", params.output_path);
    Ok(params.output_path)
}

/// 生成片段预览视频
#[tauri::command]
async fn generate_preview(params: PreviewParams) -> Result<String, String> {
    info!("生成预览片段: {:?}", params);

    if !is_ffmpeg_installed() {
        return Err("未安装FFmpeg，请先安装FFmpeg后再试".into());
    }

    let temp_dir = std::env::temp_dir().join("mangaai_preview");
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

    let ffmpeg_command = format!(
        "ffmpeg -y -ss {} -i \"{}\" -t {} -vf \"{}\" -c:v libx264 -c:a aac -strict experimental \"{}\"",
        params.segment.start,
        params.input_path,
        duration,
        video_filters,
        preview_path
    );

    info!("执行预览命令: {}", ffmpeg_command);
    let output = Command::new("sh")
        .arg("-c")
        .arg(&ffmpeg_command)
        .output()
        .map_err(|e| format!("执行FFmpeg命令失败: {}", e))?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        error!("FFmpeg错误: {}", err);
        return Err(format!("生成预览失败: {}", err));
    }

    Ok(preview_path)
}

/// 清理临时文件
#[tauri::command]
fn clean_temp_file(params: CleanFileParams) -> Result<(), String> {
    info!("清理临时文件: {}", params.path);

    if !params.path.contains("temp") && !params.path.contains("mangaai") {
        return Err("无效的临时文件路径".into());
    }

    if let Err(e) = fs::remove_file(&params.path) {
        error!("删除文件失败: {}", e);
        return Err(format!("清理临时文件失败: {}", e));
    }

    Ok(())
}

/// 检查FFmpeg是否已安装
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

// 工具函数: 检查FFmpeg是否安装
fn is_ffmpeg_installed() -> bool {
    Command::new("ffmpeg")
        .arg("-version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

// 工具函数: 解析FFmpeg帧率字符串
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

// 工具函数: 生成随机ID
fn random_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    format!("{}", now)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
        .init();

    info!("ManGa AI 启动中...");

    tauri::Builder::default()
        .setup(|app| {
            info!("应用程序初始化完成");

            if let Some(window) = app.get_window("main") {
                info!("主窗口已创建: {}", window.label());
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            analyze_video,
            extract_key_frames,
            generate_thumbnail,
            cut_video,
            generate_preview,
            clean_temp_file,
            check_ffmpeg,
            // 窗口操作
            show_main_window,
            hide_main_window,
            toggle_fullscreen,
            // 应用设置
            get_app_settings,
            save_app_settings,
            // 文件操作
            get_app_data_path,
            open_file_location,
            // 快捷键
            register_shortcut,
            unregister_shortcut,
            get_registered_shortcuts,
        ])
        .setup(|app| {
            info!("应用程序设置完成");

            // 系统托盘通过 tauri.conf.json 配置
            if let Some(window) = app.get_window("main") {
                info!("主窗口已创建: {}", window.label());
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("启动 ManGa AI 时发生错误");
}

// ========== 桌面应用功能 ==========

// 应用设置结构
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AppSettings {
    pub theme: String,
    pub language: String,
    pub auto_save: bool,
    pub auto_save_interval: u32,
    pub default_quality: String,
    pub default_format: String,
    pub notification_enabled: bool,
    pub minimize_to_tray: bool,
    pub start_minimized: bool,
    pub check_update_on_start: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        AppSettings {
            theme: "light".to_string(),
            language: "zh-CN".to_string(),
            auto_save: true,
            auto_save_interval: 300,
            default_quality: "medium".to_string(),
            default_format: "mp4".to_string(),
            notification_enabled: true,
            minimize_to_tray: true,
            start_minimized: false,
            check_update_on_start: true,
        }
    }
}

// 显示主窗口
#[tauri::command]
fn show_main_window(app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        info!("主窗口已显示");
        Ok(())
    } else {
        Err("未找到主窗口".to_string())
    }
}

// 隐藏主窗口
#[tauri::command]
fn hide_main_window(app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_window("main") {
        window.hide().map_err(|e| e.to_string())?;
        info!("主窗口已隐藏");
        Ok(())
    } else {
        Err("未找到主窗口".to_string())
    }
}

// 切换全屏
#[tauri::command]
fn toggle_fullscreen(app_handle: tauri::AppHandle) -> Result<bool, String> {
    if let Some(window) = app_handle.get_window("main") {
        let is_fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;
        window.set_fullscreen(!is_fullscreen).map_err(|e| e.to_string())?;
        info!("全屏状态: {}", !is_fullscreen);
        Ok(!is_fullscreen)
    } else {
        Err("未找到主窗口".to_string())
    }
}

// 获取应用设置
#[tauri::command]
fn get_app_settings(app_handle: tauri::AppHandle) -> Result<AppSettings, String> {
    let config_dir = app_handle.path_resolver().app_config_dir()
        .ok_or("无法获取配置目录")?;
    let settings_file = config_dir.join("settings.json");

    if settings_file.exists() {
        let content = fs::read_to_string(&settings_file).map_err(|e| e.to_string())?;
        let settings: AppSettings = serde_json::from_str(&content).map_err(|e| e.to_string())?;
        Ok(settings)
    } else {
        Ok(AppSettings::default())
    }
}

// 保存应用设置
#[tauri::command]
fn save_app_settings(app_handle: tauri::AppHandle, settings: AppSettings) -> Result<(), String> {
    let config_dir = app_handle.path_resolver().app_config_dir()
        .ok_or("无法获取配置目录")?;

    // 确保目录存在
    fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;

    let settings_file = config_dir.join("settings.json");
    let content = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(&settings_file, content).map_err(|e| e.to_string())?;

    info!("应用设置已保存");
    Ok(())
}

// 获取应用数据路径
#[tauri::command]
fn get_app_data_path(app_handle: tauri::AppHandle) -> Result<String, String> {
    let data_dir = app_handle.path_resolver().app_data_dir()
        .ok_or("无法获取数据目录")?;
    Ok(data_dir.to_string_lossy().to_string())
}

// 打开文件位置
#[tauri::command]
fn open_file_location(path: String) -> Result<(), String> {
    let path = PathBuf::from(&path);

    if !path.exists() {
        return Err("文件不存在".to_string());
    }

    let parent = if path.is_file() {
        path.parent().map(|p| p.to_path_buf())
    } else {
        Some(path)
    };

    if let Some(dir) = parent {
        #[cfg(target_os = "macos")]
        {
            Command::new("open").arg(dir).spawn().map_err(|e| e.to_string())?;
        }
        #[cfg(target_os = "windows")]
        {
            Command::new("explorer").arg(dir).spawn().map_err(|e| e.to_string())?;
        }
        #[cfg(target_os = "linux")]
        {
            Command::new("xdg-open").arg(dir).spawn().map_err(|e| e.to_string())?;
        }
        Ok(())
    } else {
        Err("无法确定父目录".to_string())
    }
}

// 快捷键注册结构
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ShortcutInfo {
    pub id: String,
    pub key: String,
    pub action: String,
    pub description: String,
}

// 存储已注册的快捷键
static REGISTERED_SHORTCUTS: Mutex<Vec<ShortcutInfo>> = Mutex::new(Vec::new());

// 注册快捷键
#[tauri::command]
fn register_shortcut(id: String, key: String, action: String, description: String) -> Result<(), String> {
    info!("注册快捷键: {} -> {} ({})", key, action, description);

    let mut shortcuts = REGISTERED_SHORTCUTS.lock().map_err(|e| e.to_string())?;

    // 检查是否已存在
    if shortcuts.iter().any(|s| s.id == id) {
        return Err(format!("快捷键 ID {} 已存在", id));
    }

    shortcuts.push(ShortcutInfo {
        id,
        key,
        action,
        description,
    });

    Ok(())
}

// 注销快捷键
#[tauri::command]
fn unregister_shortcut(id: String) -> Result<(), String> {
    info!("注销快捷键: {}", id);

    let mut shortcuts = REGISTERED_SHORTCUTS.lock().map_err(|e| e.to_string())?;
    shortcuts.retain(|s| s.id != id);

    Ok(())
}

// 获取已注册的快捷键列表
#[tauri::command]
fn get_registered_shortcuts() -> Result<Vec<ShortcutInfo>, String> {
    let shortcuts = REGISTERED_SHORTCUTS.lock().map_err(|e| e.to_string())?;
    Ok(shortcuts.clone())
}
