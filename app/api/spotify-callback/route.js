import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/?error=spotify_denied', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
        ).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI || 'https://moodplaylist-ten.vercel.app/api/spotify-callback'
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Token error:', tokenData);
      return NextResponse.redirect(new URL('/?error=token_failed', request.url));
    }

    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('spotify_token', tokenData.access_token);
    redirectUrl.searchParams.set('spotify_refresh', tokenData.refresh_token || '');
    
    return NextResponse.redirect(redirectUrl);

  } catch (err) {
    console.error('Callback error:', err);
    return NextResponse.redirect(new URL('/?error=callback_failed', request.url));
  }
}
