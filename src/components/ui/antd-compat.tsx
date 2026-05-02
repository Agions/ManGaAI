"use client"

import { User } from 'lucide-react';
import * as React from "react"
import { useForm as useRhfForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Avatar as ShadcnAvatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card as ShadcnCard } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu as DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Empty as ShadcnEmpty } from '@/components/ui/empty';
import { List as ShadcnList, ListItem } from '@/components/ui/list';
import { Progress as ShadcnProgress } from '@/components/ui/progress';
import { Select as ShadcnSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tag as ShadcnTag } from '@/components/ui/tag';
import { Text as ShadcnText, Title as ShadcnTitle, Paragraph as ShadcnParagraph } from '@/components/ui/typography';
import { cn } from "@/shared/utils/class-names"

// ============================================================
// AntD-compatible Form (wraps react-hook-form + shadcn)
// ============================================================

interface FormProps {
  form?: any;
  layout?: 'vertical' | 'horizontal' | 'inline';
  onFinish?: (values: any) => void;
  initialValues?: Record<string, any>;
  className?: string;
  children?: React.ReactNode;
  Item?: typeof FormItem;
}

const Form: React.FC<FormProps> = ({
  form,
  layout = 'vertical',
  onFinish,
  initialValues,
  className,
  children,
}) => {
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (form) {
          form.submit();
        }
        if (onFinish) {
          const formData = new FormData(e.currentTarget);
          const values: Record<string, any> = {};
          formData.forEach((v, k) => { values[k] = v; });
          // Merge with initialValues if form has them
          if (form && initialValues) {
            Object.assign(values, initialValues);
          }
          onFinish(values);
        }
      }}
      style={{ display: 'flex', flexDirection: layout === 'vertical' ? 'column' : 'row', gap: layout === 'horizontal' ? '1rem' : 0 }}
    >
      {/* react-hook-form needs special handling, fall through for now */}
      {children}
    </form>
  );
};

// Form.Item as a property on Form - defined after FormItem declaration
interface FormItemProps {
  name?: string | string[];
  label?: React.ReactNode;
  rules?: any[];
  dependencies?: string[];
  children: React.ReactNode;
  className?: string;
}

const FormItem: React.FC<FormItemProps> = ({
  label,
  children,
  className,
}) => {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && <label className="text-sm font-medium">{label}</label>}
      {children}
    </div>
  );
};

(Form as any).Item = FormItem;

// ============================================================
// AntD-compatible Select with options prop
// ============================================================
interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

interface AntDSelectProps {
  value?: string | string[];
  defaultValue?: string | string[];
  onChange?: (value: string | string[]) => void;
  options?: SelectOption[];
  mode?: 'multiple' | 'tags';
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

const AntDSelect: React.FC<AntDSelectProps> = ({
  value,
  defaultValue,
  onChange,
  options,
  mode,
  placeholder,
  style,
  className,
  disabled,
  children,
}) => {
  const [internalValue, setInternalValue] = React.useState<string | string[]>(
    (defaultValue as string | string[]) || (mode === 'tags' ? [] : '')
  );

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (value !== undefined) setInternalValue(value);
    
  }, [value]);

  const handleValueChange = (newValue: string) => {
    if (mode === 'tags') {
      // For tags mode, add to existing tags
      const current = Array.isArray(internalValue) ? internalValue : [];
      const updated = [...current, newValue];
      setInternalValue(updated);
      onChange?.(updated);
    } else {
      setInternalValue(newValue);
      onChange?.(newValue as string);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (mode === 'tags') {
      const updated = (internalValue as string[]).filter(t => t !== tagToRemove);
      setInternalValue(updated);
      onChange?.(updated);
    }
  };

  if (mode === 'tags') {
    const tags = Array.isArray(internalValue) ? internalValue : [];
    return (
      <div className={cn("flex flex-col gap-1", className)} style={style}>
        <div className="flex flex-wrap gap-1 min-h-[38px] p-1 border border-input rounded-md bg-background">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-sm rounded"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-destructive ml-1"
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 min-w-[80px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                e.preventDefault();
                const newTag = e.currentTarget.value.trim();
                if (!(internalValue as string[]).includes(newTag)) {
                  handleValueChange(newTag);
                }
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
        {options && (
          <select
            className="hidden"
            onChange={(e) => {
              if (e.target.value) handleValueChange(e.target.value);
            }}
          >
            <option value="">选择预设</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
      </div>
    );
  }

  return (
    <ShadcnSelect
      value={value as string}
      defaultValue={defaultValue as string}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger style={style} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options?.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </SelectItem>
        ))}
        {children}
      </SelectContent>
    </ShadcnSelect>
  );
};

// Add .Group and .Button as static properties to Radio for antd-style usage

// ============================================================
// AntD-compatible Radio.Group with button style
// ============================================================
interface RadioOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

interface RadioGroupProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  optionType?: 'default' | 'button';
  buttonStyle?: 'solid' | 'outline';
  children?: React.ReactNode;
  options?: RadioOption[];
  className?: string;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  value,
  defaultValue,
  onChange,
  optionType,
  buttonStyle,
  children,
  options,
  className,
}) => {
  if (optionType === 'button') {
    return (
      <div className={cn("flex flex-wrap gap-1", className)} role="radiogroup">
        {(options ?? []).map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={opt.disabled}
            onClick={() => onChange?.(opt.value)}
            className={cn(
              "px-3 py-1.5 text-sm rounded border transition-colors",
              (value ?? defaultValue) === opt.value
                ? buttonStyle === 'solid'
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-primary/10 text-primary border-primary"
                : "bg-background text-foreground border-input hover:bg-accent",
              opt.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {opt.label}
          </button>
        ))}
        {/* Also support children pattern */}
        {children}
      </div>
    );
  }
  
  return (
    <div className={cn("flex flex-col gap-1", className)} role="radiogroup">
      {(options ?? []).map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={(value ?? defaultValue) === opt.value}
            onChange={() => onChange?.(opt.value)}
            disabled={opt.disabled}
            className="accent-primary"
          />
          <span className="text-sm">{opt.label}</span>
        </label>
      ))}
      {children}
    </div>
  );
};

interface RadioButtonProps {
  value?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

const RadioButton: React.FC<RadioButtonProps> = ({ children, ...props }) => (
  <RadioGroup {...props} options={[{ value: props.value || '', label: children || '' }]} />
);

const Radio: React.FC<any> = (props) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input type="radio" {...props} className="accent-primary" />
    <span className="text-sm">{props.children}</span>
  </label>
);

(Radio as any).Group = RadioGroup;
(Radio as any).Button = RadioButton;

// ============================================================
// Space component (flex gap wrapper)
// ============================================================
interface SpaceProps {
  direction?: 'horizontal' | 'vertical';
  size?: 'small' | 'middle' | 'large' | number;
  align?: 'start' | 'end' | 'center' | 'baseline';
  className?: string;
  children?: React.ReactNode;
  wrap?: boolean;
  style?: React.CSSProperties;
  block?: boolean;
  compact?: boolean;
}

const Space = (({
  direction = 'horizontal',
  size = 'small',
  align,
  className,
  children,
  wrap,
  style,
  block,
  compact,
}: SpaceProps) => {
  const gapMap: Record<string, string> = {
    small: '0.25rem',
    middle: '0.5rem',
    large: '1rem',
  };
  const gap = typeof size === 'number' ? `${size}px` : gapMap[size] || '0.5rem';
  
  return (
    <div
      className={cn("flex", direction === 'vertical' ? 'flex-col' : 'flex-row', wrap && 'flex-wrap', block && 'w-full', className)}
      style={{
        gap: compact ? 0 : gap,
        alignItems: align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : align === 'baseline' ? 'baseline' : 'center',
        ...style,
      }}
    >
      {children}
    </div>
  );
}) as unknown as React.FC<SpaceProps> & { Item: React.FC<{ children?: React.ReactNode; className?: string }>; Compact: React.FC<SpaceCompactProps> };

const SpaceItem: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("flex-1 min-w-0", className)}>{children}</div>
);
(Space as any).Item = SpaceItem;

// Space.Compact - a compact mode where items are joined together
interface SpaceCompactProps {
  block?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const SpaceCompact: React.FC<SpaceCompactProps> = ({ block, children, className }) => (
  <div
    className={cn("flex", block && 'w-full', className)}
    style={{ gap: 0 }}
  >
    {children}
  </div>
);
(Space as any).Compact = SpaceCompact;

// ============================================================
// AntD-compatible Spin (loading spinner)
// ============================================================
interface SpinProps {
  size?: 'small' | 'default' | 'large';
  tip?: React.ReactNode;
  className?: string;
  spinning?: boolean;
  indicator?: React.ReactNode;
  children?: React.ReactNode;
}

const Spin: React.FC<SpinProps> = ({
  size = 'default',
  tip,
  className,
  spinning = true,
  indicator,
  children,
}) => {
  const sizeMap = { small: '1rem', default: '1.5rem', large: '2rem' };
  const spinnerSize = sizeMap[size];
  
  if (!spinning) return <>{children}</>;
  
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      {indicator || (
        <span
          className="inline-block animate-spin"
          style={{ fontSize: spinnerSize, lineHeight: spinnerSize }}
        >
          ⟳
        </span>
      )}
      {tip && <span className="text-sm text-muted-foreground">{tip}</span>}
    </div>
  );
};

// ============================================================
// AntD-compatible Alert (wraps shadcn Alert)
// ============================================================
interface AntDAlertProps {
  type?: 'success' | 'info' | 'warning' | 'error' | 'default';
  showIcon?: boolean;
  message?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  closeable?: boolean;
  onClose?: () => void;
}

const typeIconMap: Record<string, React.ReactNode> = {
  success: <span className="text-green-500">✓</span>,
  warning: <span className="text-yellow-500">⚠</span>,
  error: <span className="text-red-500">✕</span>,
  info: <span className="text-blue-500">ℹ</span>,
  default: <span className="text-muted-foreground">!</span>,
};

const AntDAlert: React.FC<AntDAlertProps> = ({
  type = 'default',
  showIcon,
  message,
  description,
  className,
  children,
}) => {
  return (
    <div className={cn("flex flex-col gap-1 p-3 rounded-md border", className)}>
      <div className="flex items-start gap-2">
        {showIcon && <span className="mt-0.5">{typeIconMap[type]}</span>}
        <div className="flex flex-col gap-0.5">
          {message && <div className="text-sm font-medium">{message}</div>}
          {description && <div className="text-sm text-muted-foreground">{description}</div>}
          {children}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// AntD-compatible Modal (wraps shadcn Dialog)
// ============================================================
interface ModalProps {
  open?: boolean;
  onCancel?: () => void;
  onOk?: () => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number | string;
  children?: React.ReactNode;
  className?: string;
  maskClosable?: boolean;
  closable?: boolean;
  destroyOnClose?: boolean;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
}

const ModalFn: React.FC<ModalProps> = ({
  open,
  onCancel,
  onOk,
  title,
  footer,
  width = 520,
  children,
  className,
  maskClosable = true,
  closable = true,
  okText,
  cancelText,
}) => {
  const [isOpen, setIsOpen] = React.useState(open ?? false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open !== undefined) setIsOpen(open);
    
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      onCancel?.();
    }
    setIsOpen(newOpen);
  };

  const handleCancel = () => {
    onCancel?.();
    setIsOpen(false);
  };

  const handleOk = () => {
    onOk?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={className}
        style={{ maxWidth: typeof width === 'number' ? width : width }}
        onPointerDownOutside={(e) => {
          if (!maskClosable) e.preventDefault();
        }}
      >
        {closable && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
          </DialogHeader>
        )}
        {title && !closable && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        <div className="py-2">{children}</div>
        {footer && <div className="flex justify-end gap-2 mt-4">{footer}</div>}
        {footer === undefined && (onOk || okText) && (
          <DialogFooter>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
            >
              {cancelText || '取消'}
            </button>
            <button
              type="button"
              onClick={handleOk}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              {okText || '确定'}
            </button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Modal.confirm helper
const ModalConfirm = ({ title, content, onOk, onCancel }: { title?: React.ReactNode; content?: React.ReactNode; onOk?: () => void; onCancel?: () => void }) => {
  const [open, setOpen] = React.useState(true);
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) onCancel?.(); }}>
      <DialogContent>
        {title && <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>}
        {content && <div className="py-2">{content}</div>}
        <DialogFooter>
          <button type="button" onClick={() => { setOpen(false); onCancel?.(); }} className="px-4 py-2 text-sm border rounded-md hover:bg-accent">取消</button>
          <button type="button" onClick={() => { setOpen(false); onOk?.(); }} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">确定</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ModalConfirmDialog: React.FC<{
  title?: React.ReactNode;
  content?: React.ReactNode;
  onOk?: () => void;
  onCancel?: () => void;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  okType?: string;
}> = ({ title, content, onOk, onCancel, okText = '确定', cancelText = '取消', okType }) => {
  const [open, setOpen] = React.useState(true);
  const okClass = okType === 'danger' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-primary text-primary-foreground hover:bg-primary/90';
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) onCancel?.(); }}>
      <DialogContent>
        {title && <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>}
        {content && <div className="py-2">{content}</div>}
        <DialogFooter>
          <button type="button" onClick={() => { setOpen(false); onCancel?.(); }} className="px-4 py-2 text-sm border rounded-md hover:bg-accent">{cancelText}</button>
          <button type="button" onClick={() => { setOpen(false); onOk?.(); }} className={cn("px-4 py-2 text-sm rounded-md hover:bg-primary/90", okClass)}>{okText}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Modal = ModalFn as unknown as React.FC<ModalProps> & {
  confirm: (props: { title?: React.ReactNode; content?: React.ReactNode; onOk?: () => void; onCancel?: () => void; okText?: React.ReactNode; cancelText?: React.ReactNode; okType?: string }) => React.ReactElement;
  confirmAlt: (props: { title?: React.ReactNode; content?: React.ReactNode; onOk?: () => void; onCancel?: () => void }) => React.ReactElement;
};
(Modal as any).confirm = (props: { title?: React.ReactNode; content?: React.ReactNode; onOk?: () => void; onCancel?: () => void; okText?: React.ReactNode; cancelText?: React.ReactNode; okType?: string }) => React.createElement(ModalConfirmDialog, props);
(Modal as any).confirmAlt = ModalConfirm;

// ============================================================
// AntD-compatible Button
// ============================================================
interface ButtonProps {
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  size?: 'small' | 'middle' | 'large';
  icon?: React.ReactNode;
  shape?: 'default' | 'circle' | 'round';
  block?: boolean;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  htmlType?: React.ButtonHTMLAttributes<HTMLButtonElement>['type'];
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  style?: React.CSSProperties;
  danger?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  type = 'default',
  size = 'middle',
  icon,
  shape = 'default',
  block,
  className,
  children,
  disabled,
  loading,
  ...props
}) => {
  const sizeClass = size === 'small' ? 'h-8 px-3 text-xs' : size === 'large' ? 'h-11 px-6 text-base' : 'h-10 px-4 text-sm';
  const shapeClass = shape === 'circle' ? 'rounded-full px-0 w-10' : shape === 'round' ? 'rounded-full' : 'rounded-md';
  const typeClass = type === 'primary' ? 'bg-primary text-primary-foreground hover:bg-primary/90' :
                    type === 'dashed' ? 'border border-dashed border-input hover:bg-accent' :
                    type === 'link' ? 'text-primary underline hover:no-underline' :
                    type === 'text' ? 'hover:bg-accent' :
                    'bg-background border border-input hover:bg-accent';

  return (
    <button
      type={props.htmlType || 'button'}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        sizeClass,
        shapeClass,
        typeClass,
        block && "w-full",
        className
      )}
      {...props}
    >
      {loading ? <span className="animate-spin">⟳</span> : icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

// AntD-compatible Input (native input wrapper)
// ============================================================
interface AntDInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  size?: 'large' | 'small' | 'middle';
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

const AntDInput = React.forwardRef<HTMLInputElement, AntDInputProps>(
  ({ size = 'middle', prefix, suffix, className, ...props }, ref) => {
    const sizeClass = size === 'large' ? 'h-11' : size === 'small' ? 'h-8' : 'h-10';
    return (
      <div className={cn("flex items-center border border-input rounded-md bg-background px-3 py-1 focus-within:ring-2 focus-within:ring-ring", className)}>
        {prefix && <span className="mr-2 text-muted-foreground">{prefix}</span>}
        <input ref={ref} className={cn("flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground", sizeClass)} {...props} />
        {suffix && <span className="ml-2 text-muted-foreground">{suffix}</span>}
      </div>
    );
  }
);
AntDInput.displayName = 'AntDInput';

// ============================================================
// AntD-compatible List
// ============================================================
interface ListGridSettings {
  gutter?: number;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  column?: number;
}

interface ListItemProps {
  children?: React.ReactNode;
  className?: string;
}

const ListItemWrapper: React.FC<ListItemProps> = ({ children, className }) => (
  <div className={cn("py-2 border-b last:border-b-0", className)}>{children}</div>
);

interface ListWrapperProps<T = any> {
  size?: 'small' | 'middle' | 'large';
  className?: string;
  children?: React.ReactNode;
  grid?: ListGridSettings;
  dataSource?: T[];
  renderItem?: (item: T, index: number) => React.ReactNode;
  locale?: { emptyText?: React.ReactNode };
}

const ListWrapper = (({ size: _size, className, children, grid, dataSource, renderItem, locale }: ListWrapperProps<any>) => {
  // If dataSource and renderItem are provided, map over them
  if (dataSource && renderItem) {
    if (dataSource.length === 0) {
      return <div className={cn("py-4 text-center text-sm text-muted-foreground", className)}>{locale?.emptyText || '暂无数据'}</div>;
    }
    const items = dataSource.map((item, index) => renderItem(item, index));
    
    // Apply grid layout if specified
    if (grid) {
      const colCount = grid.column || grid.md || 3;
      return (
        <div 
          className={cn("grid gap-4", className)}
          style={{ 
            gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`
          }}
        >
          {items}
        </div>
      );
    }
    
    return <div className={className}>{items}</div>;
  }
  
  return <ShadcnList className={className}>{children}</ShadcnList>;
}) as unknown as React.FC<ListWrapperProps<any>> & { Item: React.FC<ListItemProps> };
(ListWrapper as any).Item = ListItemWrapper;

// ============================================================
// AntD-compatible Tag
// ============================================================
const AntdTag: React.FC<any> = ({ children, color, ...props }) => (
  <ShadcnTag color={color} {...props}>{children}</ShadcnTag>
);

// ============================================================
// AntD-compatible Table
// ============================================================
interface TableColumn<T = any> {
  title?: React.ReactNode;
  dataIndex?: string;
  key?: string;
  width?: number | string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  [key: string]: any;
}

interface TableProps<T = any> {
  dataSource?: T[];
  columns?: TableColumn<T>[];
  rowKey?: string | ((record: T) => string);
  size?: 'small' | 'middle' | 'large';
  pagination?: boolean | object;
  className?: string;
  onChange?: (pagination: any, filters: any, sorter: any) => void;
  [key: string]: any;
}

const AntdTable: React.FC<TableProps> = ({ 
  dataSource = [], 
  columns = [], 
  rowKey, 
  size = 'middle',
  className,
  ..._props 
}) => {
  const getRowKey = (record: any, index: number): string => {
    if (typeof rowKey === 'function') return rowKey(record);
    if (typeof rowKey === 'string') return record[rowKey] ?? String(index);
    return String(index);
  };

  const sizeClass = size === 'small' ? 'text-xs' : size === 'large' ? 'text-base' : 'text-sm';

  return (
    <div className={cn("relative w-full overflow-auto", className)}>
      <table className={cn("w-full caption-bottom", sizeClass)}>
        <thead>
          <tr className="border-b">{columns.map((col, i) => (
            <th key={col.key || i} style={{ width: col.width }} className="text-left font-medium p-2">{col.title}</th>
          ))}</tr>
        </thead>
        <tbody>
          {dataSource.length === 0 ? (
            <tr><td colSpan={columns.length} className="text-center p-4 text-muted-foreground">暂无数据</td></tr>
          ) : (
            dataSource.map((record, rowIndex) => (
              <tr key={getRowKey(record, rowIndex)} className="border-b last:border-b-0 hover:bg-muted/50">
                {columns.map((col, colIndex) => {
                  const value = col.dataIndex ? record[col.dataIndex] : undefined;
                  return (
                    <td key={col.key || colIndex} className="p-2">
                      {col.render ? col.render(value, record, rowIndex) : value}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================
// InputNumber component (native number input wrapper)
// ============================================================
interface InputNumberProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: 'large' | 'small' | 'middle';
  style?: React.CSSProperties;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const InputNumber = React.forwardRef<HTMLInputElement, InputNumberProps>(
  ({ value, defaultValue, onChange, min, max, step, size, style, className, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<number | undefined>(defaultValue ?? value);

    React.useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (value !== undefined) setInternalValue(value);
       
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value === '' ? null : parseFloat(e.target.value);
      setInternalValue(val ?? undefined);
      onChange?.(val);
    };

    const sizeClass = size === 'large' ? 'h-11' : size === 'small' ? 'h-8' : 'h-10';

    return (
      <input
        ref={ref}
        type="number"
        value={internalValue ?? ''}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          sizeClass,
          className
        )}
        style={style}
        {...props}
      />
    );
  }
);
InputNumber.displayName = 'InputNumber';

// ============================================================
// Divider component
// ============================================================
interface DividerProps {
  style?: React.CSSProperties;
  orientation?: 'left' | 'right' | 'center';
  className?: string;
  children?: React.ReactNode;
}

const Divider: React.FC<DividerProps> = ({ orientation: _orientation = 'left', className, children }) => {
  if (children) {
    return (
      <div className={cn("relative my-4", className)}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-2 text-xs text-muted-foreground">{children}</span>
        </div>
      </div>
    );
  }
  return <div className={cn("my-4 border-t border-border", className)} />;
};

// ============================================================
// Row and Col components (flex grid wrappers)
// ============================================================
interface RowProps {
  gutter?: number | [number, number];
  align?: 'top' | 'middle' | 'bottom' | 'stretch';
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between';
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const Row: React.FC<RowProps> = ({ gutter, align, justify, className, style, children }) => {
  const [gx, gy = 0] = Array.isArray(gutter) ? gutter : [gutter ?? 0, 0];
  return (
    <div
      className={cn("flex flex-wrap", className)}
      style={{
        gap: gy ? `${gy}px ${gx}px` : `${gx}px`,
        alignItems: align === 'top' ? 'flex-start' : align === 'middle' ? 'center' : align === 'bottom' ? 'flex-end' : 'stretch',
        justifyContent: justify === 'start' ? 'flex-start' : justify === 'end' ? 'flex-end' : justify === 'center' ? 'center' : justify === 'space-around' ? 'space-around' : justify === 'space-between' ? 'space-between' : 'flex-start',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

interface ColProps {
  span?: number;
  offset?: number;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  xxl?: number;
  className?: string;
  children?: React.ReactNode;
}

const Col: React.FC<ColProps> = ({ span = 24, offset, xs, sm, md, lg, xl, xxl, className, children }) => {
  // Responsive breakpoints: xs < 576, sm >= 576, md >= 768, lg >= 992, xl >= 1200, xxl >= 1400
  // Use largest matching breakpoint if set
  let spanVal = span;
  const bpList: Array<[string, number | undefined]> = [['xxl', xxl], ['xl', xl], ['lg', lg], ['md', md], ['sm', sm], ['xs', xs]];
  for (const [, val] of bpList) {
    if (val !== undefined) { spanVal = val; break; }
  }
  
  return (
    <div
      className={cn(className)}
      style={{
        flexBasis: `${(spanVal / 24) * 100}%`,
        maxWidth: `${(spanVal / 24) * 100}%`,
        paddingLeft: offset ? `${(offset / 24) * 100}%` : undefined,
      }}
    >
      {children}
    </div>
  );
};

// ============================================================
// Collapse (wraps existing Accordion)
// ============================================================
interface CollapseItem {
  key: string;
  label: React.ReactNode;
  children: React.ReactNode;
}

interface CollapseProps {
  activeKey?: string | string[];
  defaultActiveKey?: string | string[];
  onChange?: (key: string | string[]) => void;
  accordion?: boolean;
  className?: string;
  children?: React.ReactNode;
  items?: CollapseItem[];
  ghost?: boolean;
}

interface CollapsePanelProps {
  key?: string;
  header?: React.ReactNode;
  children?: React.ReactNode;
}

const CollapsePanel: React.FC<CollapsePanelProps> = ({ header: _header, children: _children }) => null;

const CollapseBase: React.FC<CollapseProps> = ({
  activeKey,
  defaultActiveKey,
  onChange,
  accordion,
  className,
  children,
  items,
  ghost,
}) => {
  const getDefaultActiveKey = () => {
    if (defaultActiveKey === undefined) return [];
    return Array.isArray(defaultActiveKey) ? defaultActiveKey : [defaultActiveKey];
  };

  const [activeKeys, setActiveKeys] = React.useState<Set<string>>(new Set(getDefaultActiveKey()));

  React.useEffect(() => {
    if (activeKey !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveKeys(new Set(Array.isArray(activeKey) ? activeKey : [activeKey]));
    }
     
  }, [activeKey]);

  const toggleKey = (key: string) => {
    let newKeys: Set<string>;
    if (accordion) {
      newKeys = activeKeys.has(key) ? new Set() : new Set([key]);
    } else {
      newKeys = new Set(activeKeys);
      if (newKeys.has(key)) newKeys.delete(key);
      else newKeys.add(key);
    }
    setActiveKeys(newKeys);
    const result = accordion ? [...newKeys][0] || '' : [...newKeys];
    onChange?.(newKeys.size === 0 ? (Array.isArray(activeKey) ? [] : '') as any : result as any);
  };

  // Parse children to extract panels OR use items prop
  const panels: { key: string; header: React.ReactNode; children: React.ReactNode }[] = [];
  if (items) {
    panels.push(...items.map(item => ({ key: item.key, header: item.label, children: item.children })));
  } else {
    React.Children.forEach(children, (child: any) => {
      if (child?.props?.key) {
        panels.push({
          key: String(child.props.key),
          header: child.props.header,
          children: child.props.children,
        });
      }
    });
  }

  return (
    <div className={cn("flex flex-col rounded-md", ghost ? "" : "border", className)}>
      {panels.map((panel) => {
        const isOpen = activeKeys.has(panel.key);
        return (
          <div key={panel.key} className="border-b last:border-b-0">
            <button
              type="button"
              onClick={() => toggleKey(panel.key)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:underline bg-background"
            >
              <span>{panel.header}</span>
              <span className={cn("transition-transform", isOpen ? "rotate-180" : "")}>▼</span>
            </button>
            {isOpen && <div className="px-4 pb-4 text-sm">{panel.children}</div>}
          </div>
        );
      })}
    </div>
  );
};
(CollapseBase as any).Panel = CollapsePanel;
const Collapse = CollapseBase as unknown as React.FC<CollapseProps> & { Panel: React.FC<CollapsePanelProps> };

// ============================================================
// Card component (wraps shadcn Card)
// ============================================================
interface CardMetaProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  avatar?: React.ReactNode;
  className?: string;
}

const CardMeta: React.FC<CardMetaProps> = ({ title, description, avatar }) => (
  <div className="flex gap-3">
    {avatar && <div className="flex-shrink-0">{avatar}</div>}
    <div className="flex-1 min-w-0">
      {title && <div className="font-medium text-sm">{title}</div>}
      {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
    </div>
  </div>
);

interface AntdCardProps {
  hoverable?: boolean;
  className?: string;
  cover?: React.ReactNode;
  actions?: React.ReactNode[];
  children?: React.ReactNode;
  size?: 'small' | 'default';
  extra?: React.ReactNode;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  style?: React.CSSProperties;
}

const AntdCardBase: React.FC<AntdCardProps> = ({
  hoverable,
  className,
  cover,
  actions,
  children,
  size: _size,
  extra,
  title,
  footer,
  onClick,
  style,
}) => (
  <ShadcnCard className={cn(hoverable && "hover:shadow-md transition-shadow cursor-pointer", className)} onClick={onClick} style={style}>
    {title && (
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">{title}</div>
        {extra && <div>{extra}</div>}
      </div>
    )}
    {cover && <div className="p-4">{cover}</div>}
    <div className="p-4">
      {children}
      {extra && !title && <div className="mt-2">{extra}</div>}
    </div>
    {actions && actions.length > 0 && (
      <div className="flex border-t divide-x">
        {actions.map((action, i) => (
          <div key={i} className="flex-1 flex justify-center py-2 hover:bg-muted/50">{action}</div>
        ))}
      </div>
    )}
    {footer && <div className="px-6 py-4 border-t">{footer}</div>}
  </ShadcnCard>
);
(AntdCardBase as any).Meta = CardMeta;
const AntdCard = AntdCardBase as unknown as React.FC<AntdCardProps> & { Meta: React.FC<CardMetaProps> };

// ============================================================
// Popconfirm component
// ============================================================
interface PopconfirmProps {
  children?: React.ReactNode;
  title?: React.ReactNode;
  onConfirm?: () => void;
  okText?: string;
  cancelText?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

const Popconfirm: React.FC<PopconfirmProps> = ({ children, title, onConfirm, okText = '确定', cancelText = '取消', disabled }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <span>
      <span onClick={() => !disabled && setOpen(true)}>{children}</span>
      {open && (
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); }}>
          <DialogContent>
            {title && <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>}
            <DialogFooter>
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm border rounded-md hover:bg-accent">{cancelText}</button>
              <button type="button" onClick={() => { setOpen(false); onConfirm?.(); }} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">{okText}</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </span>
  );
};

// ============================================================
// AntD-compatible Dropdown (wraps DropdownMenu)
// ============================================================
interface DropdownProps {
  menu?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items?: any[];
    onClick?: (info: { key: string }) => void;
  };
  children?: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trigger?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  placement?: any;
}

const AntDDropdown: React.FC<DropdownProps> = ({ menu, children }) => {
  const [open, setOpen] = React.useState(false);
  
  return (
    <DropdownMenuRoot open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <span className="cursor-pointer inline-flex">{children}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {menu?.items?.map((item, index) => (
          item.type === 'divider' ? (
            <DropdownMenuSeparator key={`divider-${index}`} />
          ) : (
            <DropdownMenuItem 
              key={item.key} 
              onClick={() => { item.onClick?.(); setOpen(false); menu?.onClick?.({ key: item.key || '' }); }}
              className={cn(item.danger && "text-destructive")}
            >
              {item.label}
            </DropdownMenuItem>
          )
        ))}
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};

// ============================================================
// Option component (for Select children)
// ============================================================
interface OptionProps {
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
  key?: string;
}

const Option: React.FC<OptionProps> = ({ children, ...props }) => (
  <option {...props}>{children}</option>
);

// ============================================================
// TextArea component
// ============================================================
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  rows?: number;
  showCount?: boolean;
  maxLength?: number;
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ rows = 3, showCount, maxLength, className, value, ...props }, ref) => (
    <div className="relative">
      <textarea
        ref={ref}
        rows={rows}
        maxLength={maxLength}
        value={value}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
      {showCount && maxLength && value !== undefined && (
        <div className="absolute bottom-1 right-2 text-xs text-muted-foreground">
          {String(value).length}/{maxLength}
        </div>
      )}
    </div>
  )
);
TextArea.displayName = 'TextArea';

// ============================================================
// message API (wraps sonner toast)
// ============================================================
const message = {
  success: (content: React.ReactNode) => toast.success(String(content)),
  error: (content: React.ReactNode) => toast.error(String(content)),
  warning: (content: React.ReactNode) => toast.warning(String(content)),
  info: (content: React.ReactNode) => toast.info(String(content)),
  loading: (content: React.ReactNode) => toast.loading(String(content)),
};

// ============================================================
// ColorPicker component (simple color input)
// ============================================================
interface ColorPickerProps {
  value?: string;
  onChange?: (color: { toHexString: () => string }) => void;
  showText?: boolean;
  size?: 'small' | 'middle' | 'large';
  className?: string;
  style?: React.CSSProperties;
  presetColors?: string[];
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  showText,
  size = 'middle',
  className,
  style,
}) => {
  const [internalValue, setInternalValue] = React.useState(value || '#000000');
  const sizeClass = size === 'small' ? 'w-6 h-6' : size === 'large' ? 'w-10 h-10' : 'w-8 h-8';

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (value) setInternalValue(value);
     
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setInternalValue(newVal);
    onChange?.({
      toHexString: () => newVal,
    } as any);
  };

  return (
    <div className={cn("flex items-center gap-2", className)} style={style}>
      <input
        type="color"
        value={internalValue}
        onChange={handleChange}
        className={cn("rounded border cursor-pointer", sizeClass)}
      />
      {showText && (
        <span className="text-xs text-muted-foreground font-mono">{internalValue}</span>
      )}
    </div>
  );
};

// ============================================================
// RcFile type alias (antd internal)
export type RcFile = File & { uid?: string; };

// Upload component
// ============================================================
interface UploadProps {
  listType?: 'text' | 'picture' | 'picture-card';
  showUploadList?: boolean;
  beforeUpload?: (file: File) => boolean | Promise<boolean>;
  accept?: string;
  multiple?: boolean;
  customRequest?: (info: any) => void;
  children?: React.ReactNode;
  onChange?: (info: any) => void;
  className?: string;
}

const Upload: React.FC<UploadProps> = ({
  listType,
  showUploadList: _showUploadList,
  beforeUpload,
  accept,
  multiple,
  customRequest,
  children,
  onChange,
  className,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (customRequest) {
        customRequest({ fileList: Array.from(files) });
      } else {
        Array.from(files).forEach(file => {
          const rcFile = file as any;
          rcFile.uid = Math.random().toString(36).slice(2);
          onChange?.({ file: rcFile, fileList: [rcFile] });
          if (beforeUpload) {
            beforeUpload(file);
          }
        });
      }
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  if (listType === 'picture-card') {
    return (
      <div
        className={cn(
          "w-24 h-24 rounded-md border-2 border-dashed border-input flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors",
          className
        )}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleChange}
        />
        {children}
      </div>
    );
  }

  return (
    <div className={cn("", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />
      <div onClick={() => inputRef.current?.click()} className="cursor-pointer inline-flex">
        {children}
      </div>
    </div>
  );
};

// ============================================================
// Avatar with size prop (wraps shadcn Avatar)
// ============================================================

interface AntDAvatarProps {
  size?: number | 'small' | 'large' | 'default';
  src?: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

const AntDAvatar: React.FC<AntDAvatarProps> = ({ size = 'default', src, icon, className, children }) => {
  const sizeMap: Record<string, number> = { small: 24, default: 40, large: 64 };
  const pxSize = typeof size === 'number' ? size : sizeMap[size] || 40;

  if (children) {
    return (
      <ShadcnAvatar style={{ width: pxSize, height: pxSize }} className={className}>
        <AvatarFallback className="text-sm" style={{ width: pxSize, height: pxSize }}>
          {children}
        </AvatarFallback>
      </ShadcnAvatar>
    );
  }

  if (src) {
    return (
      <ShadcnAvatar style={{ width: pxSize, height: pxSize }} className={className}>
        <AvatarImage src={src} style={{ width: pxSize, height: pxSize }} />
        <AvatarFallback style={{ width: pxSize, height: pxSize }}>
          {icon || <User />}
        </AvatarFallback>
      </ShadcnAvatar>
    );
  }

  return (
    <ShadcnAvatar style={{ width: pxSize, height: pxSize }} className={className}>
      <AvatarFallback style={{ width: pxSize, height: pxSize }}>
        {icon || <User />}
      </AvatarFallback>
    </ShadcnAvatar>
  );
};





interface UseFormReturn {
  getValues: () => any;
  setFieldsValue: (values: any) => void;
  validateFields: () => Promise<any>;
  resetFields: () => void;
  submit: () => void;
}

function useForm(): [any, UseFormReturn] {
  const methods = useRhfForm();
  const form: UseFormReturn = {
    getValues: () => methods.getValues(),
    setFieldsValue: (values) => methods.reset(values as any),
    validateFields: async () => {
      try {
        const values = await methods.trigger();
        if (values) return methods.getValues();
        throw new Error('validation failed');
      } catch {
        throw new Error('validation failed');
      }
    },
    resetFields: () => methods.reset(),
    submit: () => methods.handleSubmit(() => {})(),
  };
  return [{}, form];
}

export {
  Form,
  FormItem,
  AntDSelect as Select,
  RadioGroup,
  Radio,
  RadioButton,
  Modal,
  InputNumber,
  Divider,
  Row,
  Col,
  Collapse,
  CollapsePanel,
  AntdCard as Card,
  CardMeta,
  Option,
  TextArea,
  message,
  ColorPicker,
  Upload,
  AntDAvatar as Avatar,
  ShadcnText as Text,
  ShadcnTitle as Title,
  ShadcnParagraph as Paragraph,
  useForm,
  Button,
  AntDInput as Input,
  ListWrapper as List,
  ListItem,
  AntdTag as Tag,
  AntdTable as Table,
  ShadcnEmpty as Empty,
  ShadcnProgress as Progress,
  Space,
  SpaceItem,
  Spin,
  AntDAlert as Alert,
  Popconfirm,
  AntDDropdown as Dropdown,
  type FormProps,
  type FormItemProps,
  type AntDSelectProps,
  type RadioGroupProps,
  type RadioOption,
  type ModalProps,
  type InputNumberProps,
  type DividerProps,
  type RowProps,
  type ColProps,
  type CollapseProps,
  type CollapsePanelProps,
  type CardMetaProps,
  type OptionProps,
  type TextAreaProps,
  type ColorPickerProps,
  type UploadProps,
  type AntDAvatarProps,
  type ButtonProps,
  type AntDInputProps,
  type ListWrapperProps,
  type ListItemProps,
  type SpinProps,
  type AntDAlertProps,
};
