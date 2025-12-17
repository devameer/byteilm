<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVideoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // User must be authenticated via Sanctum
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'video' => 'required|file|mimes:mp4,avi,mov,wmv,webm|max:512000', // 500MB
        ];
    }

    /**
     * Get custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'video.required' => 'يرجى اختيار ملف الفيديو',
            'video.file' => 'يجب أن يكون الملف المرفوع ملف فيديو صالح',
            'video.mimes' => 'نوع الفيديو غير مدعوم. الأنواع المدعومة: MP4, AVI, MOV, WMV, WebM',
            'video.max' => 'حجم الفيديو يجب أن لا يتجاوز 500 ميجابايت',
        ];
    }
}
