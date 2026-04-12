<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushTokenController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:255'],
            'platform' => ['nullable', 'string', 'in:android,ios,web'],
            'device_id' => ['nullable', 'string', 'max:255'],
            'device_name' => ['nullable', 'string', 'max:255'],
            'app_version' => ['nullable', 'string', 'max:100'],
        ]);

        $pushToken = PushToken::query()->updateOrCreate(
            ['token' => $validated['token']],
            [
                'user_id' => $request->user()->id,
                'platform' => $validated['platform'] ?? null,
                'device_id' => $validated['device_id'] ?? null,
                'device_name' => $validated['device_name'] ?? null,
                'app_version' => $validated['app_version'] ?? null,
                'last_used_at' => now(),
                'revoked_at' => null,
            ]
        );

        return response()->json([
            'message' => 'Push token registered.',
            'data' => [
                'id' => $pushToken->id,
                'platform' => $pushToken->platform,
                'device_name' => $pushToken->device_name,
                'app_version' => $pushToken->app_version,
                'last_used_at' => $pushToken->last_used_at,
            ],
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:255'],
        ]);

        $request->user()->pushTokens()->where('token', $validated['token'])->delete();

        return response()->json([
            'message' => 'Push token removed.',
        ]);
    }
}
