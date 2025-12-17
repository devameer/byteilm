<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'course_id' => ['nullable', 'exists:courses,id'],
            'lesson_id' => ['nullable', 'exists:lessons,id'],
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'status' => ['nullable', Rule::in(['pending', 'in_progress', 'completed', 'cancelled'])],
            'scheduled_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:scheduled_date'],
            'is_lesson' => ['nullable', 'boolean'],
            'estimated_duration' => ['nullable', 'integer', 'min:1'],
            'actual_duration' => ['nullable', 'integer', 'min:1'],
            'order' => ['nullable', 'integer', 'min:0'],
            'type' => ['nullable', 'string', 'max:50'],
            'link' => ['nullable', 'url', 'max:500'],
            'tags' => ['nullable'],
            'source_type' => ['nullable', Rule::in(['none', 'project', 'course', 'lesson'])],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'title.required' => 'عنوان المهمة مطلوب',
            'title.max' => 'عنوان المهمة يجب ألا يتجاوز 255 حرفاً',
            'project_id.exists' => 'المشروع المحدد غير موجود',
            'course_id.exists' => 'الدورة المحددة غير موجودة',
            'lesson_id.exists' => 'الدرس المحدد غير موجود',
            'priority.in' => 'الأولوية يجب أن تكون: منخفضة، متوسطة، عالية، أو عاجلة',
            'status.in' => 'الحالة يجب أن تكون: معلقة، قيد التنفيذ، مكتملة، أو ملغاة',
            'scheduled_date.date' => 'تاريخ الجدولة غير صحيح',
            'due_date.date' => 'تاريخ الاستحقاق غير صحيح',
            'due_date.after_or_equal' => 'تاريخ الاستحقاق يجب أن يكون بعد أو يساوي تاريخ الجدولة',
            'estimated_duration.integer' => 'المدة المقدرة يجب أن تكون رقماً صحيحاً',
            'estimated_duration.min' => 'المدة المقدرة يجب أن تكون على الأقل دقيقة واحدة',
            'actual_duration.integer' => 'المدة الفعلية يجب أن تكون رقماً صحيحاً',
            'actual_duration.min' => 'المدة الفعلية يجب أن تكون على الأقل دقيقة واحدة',
            'link.url' => 'الرابط غير صحيح',
            'link.max' => 'الرابط يجب ألا يتجاوز 500 حرف',
            'source_type.in' => 'نوع المصدر غير صحيح',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Sanitize string inputs
        if ($this->has('title')) {
            $this->merge([
                'title' => strip_tags($this->title),
            ]);
        }

        if ($this->has('description')) {
            $this->merge([
                'description' => strip_tags($this->description, '<p><br><strong><em><ul><ol><li>'),
            ]);
        }

        // Normalize tags
        if ($this->has('tags')) {
            $tags = $this->tags;
            if (is_string($tags)) {
                $tags = array_values(array_filter(array_map('trim', explode(',', $tags))));
            } elseif (!is_array($tags)) {
                $tags = [];
            }
            $this->merge(['tags' => $tags]);
        }
    }
}

