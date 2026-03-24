import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, hardwareId } = await req.json();

    if (!licenseKey || !hardwareId) {
      return NextResponse.json({ error: 'License key and hardware ID are required' }, { status: 400 });
    }

    // 1. Find the license
    const { data: license, error: fetchError } = await supabaseAdmin
      .from('desktop_licenses')
      .select('*')
      .eq('license_key', licenseKey)
      .single();

    if (fetchError || !license) {
      return NextResponse.json({ error: 'Invalid license key' }, { status: 404 });
    }

    // 2. Check status
    if (license.status === 'revoked') {
      return NextResponse.json({ error: 'License has been revoked' }, { status: 403 });
    }

    const isExpired = license.expires_at && new Date(license.expires_at) < new Date();
    if (license.status === 'expired' || isExpired) {
      // Auto-update status if expired but not marked
      if (license.status !== 'expired') {
        await supabaseAdmin.from('desktop_licenses').update({ status: 'expired' }).eq('id', license.id);
      }
      return NextResponse.json({ error: 'License has expired' }, { status: 403 });
    }

    // 3. If already active, check hardwareId
    if (license.status === 'active' && license.hardware_id && license.hardware_id !== hardwareId) {
      return NextResponse.json({ error: 'License is already active on another device' }, { status: 403 });
    }

    // 4. Activate if pending or if hardware_id matches
    if (license.status === 'pending') {
      const { error: updateError } = await supabaseAdmin
        .from('desktop_licenses')
        .update({
          hardware_id: hardwareId,
          status: 'active',
          activated_at: new Date().toISOString()
        })
        .eq('id', license.id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to activate license' }, { status: 500 });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
