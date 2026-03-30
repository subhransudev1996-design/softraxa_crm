import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, hardwareId } = await req.json();

    if (!licenseKey || !hardwareId) {
      return NextResponse.json({ error: 'License key and hardware ID are required' }, { status: 400 });
    }

    // This will throw a clear error if Vercel env vars are not configured
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Find the license
    const { data: license, error: fetchError } = await supabaseAdmin
      .from('desktop_licenses')
      .select('*')
      .eq('license_key', licenseKey.trim().toUpperCase())
      .single();

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError.message, fetchError.code);
      if (fetchError.code === 'PGRST116') {
        // PostgREST code for "no rows returned" - key genuinely not found
        return NextResponse.json({ error: 'Invalid license key. Please check the key and try again.' }, { status: 404 });
      }
      // Any other DB error (auth/credentials/network)
      return NextResponse.json({ error: 'Server error while validating license. Please contact support.' }, { status: 500 });
    }

    if (!license) {
      return NextResponse.json({ error: 'Invalid license key. Please check the key and try again.' }, { status: 404 });
    }

    // 2. Check status
    if (license.status === 'revoked') {
      return NextResponse.json({ error: 'This license has been revoked. Please contact support.' }, { status: 403 });
    }

    const isExpired = license.expires_at && new Date(license.expires_at) < new Date();
    if (license.status === 'expired' || isExpired) {
      // Auto-update status if expired but not marked
      if (license.status !== 'expired') {
        await supabaseAdmin.from('desktop_licenses').update({ status: 'expired' }).eq('id', license.id);
      }
      return NextResponse.json({ error: 'This license has expired. Please renew your subscription.' }, { status: 403 });
    }

    // 3. If already active, check hardwareId
    if (license.status === 'active' && license.hardware_id && license.hardware_id !== hardwareId) {
      return NextResponse.json({ error: 'License is already activated on another device. Contact support to transfer.' }, { status: 403 });
    }

    // 4. Activate if pending or same hardware
    if (license.status === 'pending' || (license.status === 'active' && license.hardware_id === hardwareId)) {
      const { error: updateError } = await supabaseAdmin
        .from('desktop_licenses')
        .update({
          hardware_id: hardwareId,
          status: 'active',
          activated_at: new Date().toISOString()
        })
        .eq('id', license.id);

      if (updateError) {
        console.error('License update error:', updateError.message);
        return NextResponse.json({ error: 'Failed to activate license. Please try again.' }, { status: 500 });
      }
    }

    // 5. Return success
    return NextResponse.json({
      success: true,
      message: 'License activated successfully',
      license: {
        status: 'active',
        expires_at: license.expires_at,
        activated_at: license.activated_at || new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('License activation exception:', error.message);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
