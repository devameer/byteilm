<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class QuizQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'quiz_id',
        'type',
        'question',
        'options',
        'correct_answer',
        'explanation',
        'points',
        'order',
        'metadata'
    ];

    protected $casts = [
        'options' => 'array',
        'metadata' => 'array',
        'points' => 'integer',
        'order' => 'integer'
    ];

    /**
     * Get the quiz that owns the question
     */
    public function quiz()
    {
        return $this->belongsTo(Quiz::class);
    }

    /**
     * Get answers for this question
     */
    public function answers()
    {
        return $this->hasMany(QuizAnswer::class);
    }

    /**
     * Check if answer is correct
     */
    public function checkAnswer($answer)
    {
        switch ($this->type) {
            case 'multiple_choice':
                return $answer == $this->correct_answer;

            case 'true_false':
                return strtolower($answer) === strtolower($this->correct_answer);

            case 'fill_blank':
            case 'short_answer':
                return $this->checkTextAnswer($answer);

            default:
                return false;
        }
    }

    /**
     * Check text answer (case-insensitive, trimmed)
     */
    protected function checkTextAnswer($answer)
    {
        $userAnswer = strtolower(trim($answer));
        $correctAnswer = strtolower(trim($this->correct_answer));

        // Exact match
        if ($userAnswer === $correctAnswer) {
            return true;
        }

        // Check for multiple acceptable answers (separated by |)
        $acceptableAnswers = explode('|', $correctAnswer);
        foreach ($acceptableAnswers as $acceptable) {
            if ($userAnswer === strtolower(trim($acceptable))) {
                return true;
            }
        }

        // Similar text (70% similarity)
        similar_text($userAnswer, $correctAnswer, $percent);
        return $percent >= 70;
    }

    /**
     * Get statistics for this question
     */
    public function getStatistics()
    {
        $totalAnswers = $this->answers()->count();
        $correctAnswers = $this->answers()->where('is_correct', true)->count();

        return [
            'total_answers' => $totalAnswers,
            'correct_answers' => $correctAnswers,
            'incorrect_answers' => $totalAnswers - $correctAnswers,
            'accuracy_rate' => $totalAnswers > 0 ? round(($correctAnswers / $totalAnswers) * 100, 2) : 0,
            'average_time' => $this->answers()->avg('time_spent_seconds') ?? 0
        ];
    }

    /**
     * Scope: Order by order field
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order');
    }

    /**
     * Scope: By type
     */
    public function scopeType($query, $type)
    {
        return $query->where('type', $type);
    }
}
