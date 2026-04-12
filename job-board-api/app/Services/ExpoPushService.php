<?php

namespace App\Services;

use App\Models\PushToken;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExpoPushService
{
    private const ENDPOINT = 'https://exp.host/--/api/v2/push/send';
    private const CHUNK_SIZE = 100;

    public function send(iterable $pushTokens, array $payload): void
    {
        $messages = collect($pushTokens)
            ->filter(fn ($pushToken) => $pushToken instanceof PushToken)
            ->filter(fn (PushToken $pushToken) => !$pushToken->revoked_at && $this->isExpoPushToken($pushToken->token))
            ->map(fn (PushToken $pushToken) => $this->buildMessage($pushToken, $payload))
            ->values();

        if ($messages->isEmpty()) {
            return;
        }

        $messages->chunk(self::CHUNK_SIZE)->each(function (Collection $chunk): void {
            $this->sendChunk($chunk);
        });
    }

    private function buildMessage(PushToken $pushToken, array $payload): array
    {
        return array_filter([
            'to' => $pushToken->token,
            'title' => $payload['title'] ?? null,
            'body' => $payload['body'] ?? null,
            'data' => $payload['data'] ?? null,
            'sound' => $payload['sound'] ?? 'default',
            'channelId' => $payload['channelId'] ?? 'default',
            'priority' => $payload['priority'] ?? 'default',
        ], static fn ($value) => $value !== null);
    }

    private function sendChunk(Collection $messages): void
    {
        try {
            $request = Http::acceptJson()
                ->asJson()
                ->timeout(10);

            $accessToken = config('services.expo.access_token');

            if (is_string($accessToken) && trim($accessToken) !== '') {
                $request = $request->withToken($accessToken);
            }

            $response = $request->post(self::ENDPOINT, $messages->all());

            if (!$response->successful()) {
                Log::warning('Expo push send failed.', [
                    'status' => $response->status(),
                    'body' => $response->json(),
                ]);

                return;
            }

            $tickets = $response->json('data');

            if (!is_array($tickets)) {
                return;
            }

            foreach ($tickets as $index => $ticket) {
                if (($ticket['status'] ?? null) !== 'error') {
                    continue;
                }

                $token = $messages->get($index)['to'] ?? null;
                $error = $ticket['details']['error'] ?? null;

                if ($error === 'DeviceNotRegistered' && is_string($token)) {
                    PushToken::query()->where('token', $token)->update([
                        'revoked_at' => now(),
                    ]);
                }

                Log::warning('Expo push ticket returned an error.', [
                    'token' => $token,
                    'error' => $error,
                    'ticket' => $ticket,
                ]);
            }
        } catch (\Throwable $exception) {
            Log::warning('Expo push send threw an exception.', [
                'message' => $exception->getMessage(),
            ]);
        }
    }

    private function isExpoPushToken(string $token): bool
    {
        return preg_match('/^(Expo|Exponent)PushToken\[[^\]]+\]$/', $token) === 1;
    }
}
