<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIConversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'context_type',
        'context_id',
        'is_active',
        'last_message_at'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_message_at' => 'datetime'
    ];

    /**
     * Get the user that owns the conversation
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all messages in this conversation
     */
    public function messages()
    {
        return $this->hasMany(AIMessage::class, 'conversation_id');
    }

    /**
     * Get the context (course, task, project, etc.)
     */
    public function context()
    {
        return $this->morphTo('context', 'context_type', 'context_id');
    }

    /**
     * Add a user message
     */
    public function addUserMessage($content, $metadata = [])
    {
        $message = $this->messages()->create([
            'role' => 'user',
            'content' => $content,
            'metadata' => $metadata
        ]);

        $this->update(['last_message_at' => now()]);

        return $message;
    }

    /**
     * Add an assistant message
     */
    public function addAssistantMessage($content, $metadata = [])
    {
        $message = $this->messages()->create([
            'role' => 'assistant',
            'content' => $content,
            'metadata' => $metadata
        ]);

        $this->update(['last_message_at' => now()]);

        return $message;
    }

    /**
     * Get conversation history formatted for AI
     */
    public function getHistoryForAI($limit = 20)
    {
        return $this->messages()
            ->latest()
            ->limit($limit)
            ->get()
            ->reverse()
            ->map(function ($message) {
                return [
                    'role' => $message->role,
                    'content' => $message->content
                ];
            })
            ->toArray();
    }

    /**
     * Archive this conversation
     */
    public function archive()
    {
        $this->update(['is_active' => false]);
    }
}
