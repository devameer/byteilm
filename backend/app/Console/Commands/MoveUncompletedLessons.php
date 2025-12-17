<?php

namespace App\Console\Commands;

use App\Models\Lesson;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class MoveUncompletedLessons extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'lessons:move-uncompleted';
    protected $description = 'Transfer incomplete lessons from yesterday to this day ';

    public function handle(): void
    {
        $yesterday = Carbon::yesterday()->toDateString();
        $today = Carbon::today()->toDateString();

        $lessons = Lesson::whereDate('scheduled_date', $yesterday)
            ->where('completed', false)
            ->get();

        foreach ($lessons as $lesson) {
            $lesson->scheduled_date = $today;
            $lesson->save();
        }

        $this->info('Infalim lessons were deported from yesterday to this day.');
    }
}