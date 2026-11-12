import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Entity automation payload: event, data, old_data
    const reload = body.data;
    if (!reload) return Response.json({ status: 'no_data' });

    // Check if calendar sync is enabled for this user
    const settings = await base44.asServiceRole.entities.UserSettings.list('-created_date', 1);
    const stg = settings[0];
    if (!stg?.calendar_sync_enabled) {
      return Response.json({ status: 'calendar_sync_disabled' });
    }

    // Get Google Calendar connection
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    const kwhAdded = reload.kwh_added || 0;
    const amountPaid = reload.amount_paid_zar || 0;
    const balanceAfter = reload.balance_after || 0;
    const eventDate = reload.created_date || new Date().toISOString();
    const startTime = new Date(eventDate);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour event

    const event = {
      summary: `⚡ Reload: ${kwhAdded} kWh — R${amountPaid.toFixed(2)}`,
      description: `Electricity reload transaction\n\n` +
        `kWh Added: ${kwhAdded}\n` +
        `Amount Paid: R${amountPaid.toFixed(2)}\n` +
        `Balance After: ${balanceAfter.toFixed(1)} kWh\n` +
        `Rate: R${kwhAdded > 0 ? (amountPaid / kwhAdded).toFixed(2) : '—'}/kWh\n\n` +
        `— Tracked by Power Pulse`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Africa/Johannesburg'
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Africa/Johannesburg'
      }
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ status: 'calendar_api_error', error: err }, { status: 500 });
    }

    const created = await res.json();
    return Response.json({ status: 'ok', calendar_event_id: created.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});