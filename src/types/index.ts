/**
 * Centralized type definitions
 * Re-exports all types from a single location
 */

// Re-export existing types
export * from './product';
export * from './database';

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

// Database entity base types
export interface BaseEntity {
    id?: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface TimestampedEntity {
    created_at: Date;
    updated_at: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

// Category types
export interface Category extends BaseEntity {
    id: number;
    name: string;
    display_order: number;
}

// Spec Field types
export type SpecFieldType = 'text' | 'number' | 'select';

export interface SpecField extends BaseEntity {
    id: number;
    field_name: string;
    field_label: string;
    field_type: SpecFieldType;
    options: string[] | null;
    display_order: number;
    is_required: boolean;
}

// Admin Session types
export interface AdminSession {
    session_id: string;
    expires_at: Date;
    created_at: Date;
}

// Form validation types
export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

// Environment types for Cloudflare Workers
export interface CloudflareEnv {
    DATABASE_URL: string;
    ADMIN_PASSWORD_HASH: string;
    SESSION_SECRET: string;
    R2_BUCKET?: R2Bucket;
    RESEND_API_KEY?: string;
}

// R2 Bucket interface (Cloudflare)
export interface R2Bucket {
    put(key: string, value: ArrayBuffer | ReadableStream, options?: R2PutOptions): Promise<R2Object>;
    get(key: string): Promise<R2ObjectBody | null>;
    delete(key: string): Promise<void>;
    list(options?: R2ListOptions): Promise<R2Objects>;
}

export interface R2PutOptions {
    httpMetadata?: {
        contentType?: string;
    };
}

export interface R2Object {
    key: string;
    size: number;
    etag: string;
}

export interface R2ObjectBody extends R2Object {
    body: ReadableStream;
    arrayBuffer(): Promise<ArrayBuffer>;
}

export interface R2ListOptions {
    prefix?: string;
    limit?: number;
    cursor?: string;
}

export interface R2Objects {
    objects: R2Object[];
    truncated: boolean;
    cursor?: string;
}
