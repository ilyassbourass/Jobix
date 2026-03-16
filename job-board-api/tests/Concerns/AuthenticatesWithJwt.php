<?php

namespace Tests\Concerns;

use App\Models\User;
use Tymon\JWTAuth\Facades\JWTAuth;

trait AuthenticatesWithJwt
{
    protected function authHeaders(User $user): array
    {
        return [
            'Authorization' => 'Bearer ' . JWTAuth::fromUser($user),
            'Accept' => 'application/json',
        ];
    }
}
