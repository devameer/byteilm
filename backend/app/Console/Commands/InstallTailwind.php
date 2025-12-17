<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class InstallTailwind extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:install-tailwind';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Install and configure Tailwind CSS';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Installing Tailwind CSS...');
        
        // Create tailwind.config.js
        $tailwindConfig = <<<EOT
module.exports = {
  content: [
    './resources/**/*.blade.php',
    './resources/**/*.js',
    './resources/**/*.vue',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOT;
        
        file_put_contents(base_path('tailwind.config.js'), $tailwindConfig);
        $this->info('Created tailwind.config.js');
        
        // Create postcss.config.js
        $postcssConfig = <<<EOT
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOT;
        
        file_put_contents(base_path('postcss.config.js'), $postcssConfig);
        $this->info('Created postcss.config.js');
        
        // Create app.css with Tailwind directives
        if (!is_dir(resource_path('css'))) {
            mkdir(resource_path('css'), 0755, true);
        }
        
        $appCss = <<<EOT
@tailwind base;
@tailwind components;
@tailwind utilities;
EOT;
        
        file_put_contents(resource_path('css/app.css'), $appCss);
        $this->info('Created resources/css/app.css with Tailwind directives');
        
        // Create app.js
        if (!is_dir(resource_path('js'))) {
            mkdir(resource_path('js'), 0755, true);
        }
        
        $appJs = <<<EOT
import './bootstrap';
import '../css/app.css';
EOT;
        
        file_put_contents(resource_path('js/app.js'), $appJs);
        $this->info('Created resources/js/app.js');
        
        // Update vite.config.js
        $viteConfig = <<<EOT
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
    ],
});
EOT;
        
        file_put_contents(base_path('vite.config.js'), $viteConfig);
        $this->info('Updated vite.config.js');
        
        $this->info('Tailwind CSS has been installed and configured successfully!');
        $this->info('Run "npm install" and "npm run dev" to compile your assets.');
        
        return self::SUCCESS;
    }
}
