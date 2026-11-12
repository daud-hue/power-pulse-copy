import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const reminderSlot = body.args?.reminder || '9am';

    const slotLabels = {
      '9am': 'morning (9am)',
      '12pm': 'midday (12pm)',
      '4pm': 'afternoon (4pm)',
      '8pm': 'evening (8pm)'
    };
    const reminderField = `reminder_${reminderSlot}`;

    const allSettings = await base44.asServiceRole.entities.UserSettings.list('-created_date', 50);

    for (const stg of allSettings) {
      if (!stg[reminderField]) continue;

      const notificationMode = stg.notification_mode || 'email';
      const wantsInApp = notificationMode === 'inapp' || notificationMode === 'both';
      const wantsEmail = notificationMode === 'email' || notificationMode === 'both';

      const userId = stg.created_by_id;
      const user = await base44.asServiceRole.entities.User.list({ id: userId }, null, 1);
      const email = user[0]?.email;
      if (!email && !wantsInApp) continue;

      const balances = await base44.asServiceRole.entities.ElectricityBalance.list('-updated_date', 1);
      const bal = balances[0];
      const dailyKwh = bal?.estimated_daily_kwh || stg.daily_kwh_estimate || 10;
      const currentKwh = bal?.current_kwh || 0;
      const daysLeft = dailyKwh > 0 ? (currentKwh / dailyKwh).toFixed(1) : '?';

      const subject = `📋 Time to log your electricity reading — ${slotLabels[reminderSlot] || reminderSlot}`;
      const body = `It's time to log your current kWh reading!

Current balance: ${currentKwh.toFixed(1)} kWh
Estimated days remaining: ${daysLeft} days

Open Power Pulse to log your reading and stay on top of your usage.

— Power Pulse`;

      if (wantsEmail && email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject,
          body
        });
      }

      if (wantsInApp && userId) {
        await base44.asServiceRole.entities.AppNotification.create({
          type: 'log_reminder',
          title: subject,
          message: body,
          user_id: userId
        });
      }
    }

    return Response.json({ status: 'ok', slot: reminderSlot, sent: allSettings.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});