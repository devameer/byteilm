<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexTaskRequest extends FormRequest
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
            'filter' => ['sometimes', Rule::in(['all', 'today', 'tomorrow', 'pending', 'in_progress', 'completed', 'standalone', 'overdue'])],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'lesson_id' => ['nullable', 'integer', 'exists:lessons,id'],
            'status' => ['nullable', Rule::in(['all', 'pending', 'in_progress', 'completed', 'cancelled'])],
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'is_lesson' => ['nullable', 'boolean'],
            'type' => ['nullable', Rule::in(['standalone', 'project', 'course', 'lesson'])],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'quick_date' => ['nullable', Rule::in(['today', 'tomorrow', 'this_week', 'next_week', 'overdue'])],
            'search' => ['nullable', 'string', 'max:255'],
            'tags' => ['nullable'],
            'order_by' => ['nullable', 'string', Rule::in(['scheduled_date', 'due_date', 'priority', 'created_at', 'title'])],
            'order_direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'with_stats' => ['nullable', 'boolean'],
            'active_courses_only' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'filter.in' => 'نوع الفلتر غير صحيح',
            'project_id.exists' => 'المشروع المحدد غير موجود',
            'course_id.exists' => 'الدورة المحددة غير موجودة',
            'lesson_id.exists' => 'الدرس المحدد غير موجود',
            'status.in' => 'الحالة غير صحيحة',
            'priority.in' => 'الأولوية غير صحيحة',
            'date_from.date' => 'تاريخ البداية غير صحيح',
            'date_to.date' => 'تاريخ النهاية غير صحيح',
            'date_to.after_or_equal' => 'تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية',
            'quick_date.in' => 'التاريخ السريع غير صحيح',
            'search.max' => 'نص البحث يجب ألا يتجاوز 255 حرفاً',
            'order_by.in' => 'حقل الترتيب غير صحيح',
            'order_direction.in' => 'اتجاه الترتيب يجب أن يكون تصاعدي أو تنازلي',
            'page.min' => 'رقم الصفحة يجب أن يكون على الأقل 1',
            'per_page.min' => 'عدد العناصر في الصفحة يجب أن يكون على الأقل 1',
            'per_page.max' => 'عدد العناصر في الصفحة يجب ألا يتجاوز 100',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Sanitize search input
        if ($this->has('search')) {
            $this->merge([
                'search' => strip_tags($this->search),
            ]);
        }

        // Convert string booleans to actual booleans
        if ($this->has('with_stats')) {
            $this->merge([
                'with_stats' => filter_var($this->with_stats, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false,
            ]);
        }

        if ($this->has('active_courses_only')) {
            $this->merge([
                'active_courses_only' => filter_var($this->active_courses_only, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false,
            ]);
        }

        if ($this->has('is_lesson')) {
            $this->merge([
                'is_lesson' => filter_var($this->is_lesson, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false,
            ]);
        }
    }
}

