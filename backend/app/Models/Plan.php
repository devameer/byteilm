<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'name',
        'display_name',
        'description',
        'price',
        'currency',
        'billing_period',
        'features',
        'limits',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'features' => 'array',
        'limits' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Ensure features are always returned as a clean array.
     */
    public function getFeaturesAttribute($value): array
    {
        return $this->prepareFeaturesData($value);
    }

    /**
     * Normalize and store features as JSON.
     */
    public function setFeaturesAttribute($value): void
    {
        $this->attributes['features'] = json_encode($this->prepareFeaturesData($value));
    }

    /**
     * Get limits as array.
     */
    public function getLimitsAttribute($value): array
    {
        if (is_string($value)) {
            // First decode
            $decoded = json_decode($value, true);

            // If still a string (double encoded), decode again
            if (is_string($decoded)) {
                $decoded = json_decode($decoded, true);
            }

            return is_array($decoded) ? $decoded : [];
        }
        return is_array($value) ? $value : [];
    }

    /**
     * Set limits as JSON.
     */
    public function setLimitsAttribute($value): void
    {
        if (is_array($value)) {
            $this->attributes['limits'] = json_encode($value);
        } else {
            $this->attributes['limits'] = $value;
        }
    }

    /**
     * Subscriptions assigned to this plan.
     */
    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Normalize various feature formats into a consistent array.
     */
    protected function prepareFeaturesData($value): array
    {
        if ($value === null) {
            return [];
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);

            if (json_last_error() === JSON_ERROR_NONE) {
                $value = $decoded;
            } else {
                $value = preg_split("/\r\n|\n|\r/", $value, -1, PREG_SPLIT_NO_EMPTY);
            }
        }

        if ($value instanceof \Illuminate\Support\Collection) {
            $value = $value->all();
        }

        if (!is_array($value)) {
            $value = [$value];
        }

        return array_values(array_filter(
            array_map(
                static fn ($feature) => trim((string) $feature),
                $value
            ),
            static fn ($feature) => $feature !== ''
        ));
    }
}
