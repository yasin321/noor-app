// Supabase Edge Function: sms-otp
// پشتیبانی از پنل پیامکی کاوه‌نگار (KAVENEGAR_API_KEY) یا SMS.ir (SMSIR_API_KEY)
// جهت فعال‌سازی:
//   supabase secrets set KAVENEGAR_API_KEY=your_key KAVENEGAR_TEMPLATE=noor-otp
//   supabase functions deploy sms-otp --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { action, phone, code, newPassword } = await req.json();
    const cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
    if (!/^09[0-9]{9}$/.test(cleanPhone)) {
      return new Response(JSON.stringify({ error: 'شماره موبایل معتبر نیست' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (action === 'send') {
      const kavenegarKey = Deno.env.get('KAVENEGAR_API_KEY');
      const kavenegarTemplate = Deno.env.get('KAVENEGAR_TEMPLATE') || 'noor-otp';
      if (!kavenegarKey) {
        return new Response(
          JSON.stringify({ error: 'کلید پنل پیامکی (KAVENEGAR_API_KEY) هنوز در سرور تنظیم نشده است.' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const otp = String(Math.floor(10000 + Math.random() * 90000));
      const codeHash = await sha256(cleanPhone + ':' + otp);
      const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();

      await admin.from('otp_reset_codes').upsert({
        phone: cleanPhone,
        code_hash: codeHash,
        expires_at: expiresAt,
        attempts: 0,
      });

      const smsUrl =
        'https://api.kavenegar.com/v1/' +
        encodeURIComponent(kavenegarKey) +
        '/verify/lookup.json?receptor=' +
        encodeURIComponent(cleanPhone) +
        '&token=' +
        encodeURIComponent(otp) +
        '&template=' +
        encodeURIComponent(kavenegarTemplate);

      const smsRes = await fetch(smsUrl);
      if (!smsRes.ok) {
        return new Response(JSON.stringify({ error: 'ارسال پیامک از پنل انجام نشد' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ ok: true, cooldownSec: 120 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'verify_and_reset') {
      const { data: rec } = await admin
        .from('otp_reset_codes')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (!rec || new Date(rec.expires_at).getTime() < Date.now()) {
        return new Response(JSON.stringify({ error: 'کد تایید منقضی شده است' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const expectedHash = await sha256(cleanPhone + ':' + String(code || '').trim());
      if (expectedHash !== rec.code_hash) {
        return new Response(JSON.stringify({ error: 'کد تایید واردشده اشتباه است' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: prof } = await admin
        .from('profiles')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (!prof?.id) {
        return new Response(JSON.stringify({ error: 'حسابی با این شماره موبایل یافت نشد' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: updErr } = await admin.auth.admin.updateUserById(prof.id, {
        password: String(newPassword),
      });
      if (updErr) {
        return new Response(JSON.stringify({ error: 'خطا در تغییر رمز عبور' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await admin.from('otp_reset_codes').delete().eq('phone', cleanPhone);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'درخواست نامعتبر' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'خطای داخلی سرویس پیامک' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
