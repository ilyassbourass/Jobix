<?php

namespace App\Notifications\Channels;

use App\Services\ExpoPushService;
use Illuminate\Notifications\Notification;

class ExpoPushChannel
{
    public function __construct(
        private readonly ExpoPushService $expoPushService
    ) {
    }

    public function send(object $notifiable, Notification $notification): void
    {
        if (!method_exists($notification, 'toExpoPush') || !method_exists($notifiable, 'pushTokens')) {
            return;
        }

        $payload = $notification->toExpoPush($notifiable);

        if (!is_array($payload) || $payload === []) {
            return;
        }

        $pushTokens = $notifiable->pushTokens()->whereNull('revoked_at')->get();

        if ($pushTokens->isEmpty()) {
            return;
        }

        $this->expoPushService->send($pushTokens, $payload);
    }
}
