import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const allSettings = await base44.asServiceRole.entities.UserSettings.list('-created_date', 50);
    
    for (const stg of allSettings) {
      if (!stg.high_usage_alert_enabled) continue;
      
      const thresholdPercent = stg.high_usage_threshold_percent || 150;
      const dailyEstimate = stg.daily_kwh_estimate || 10;
      const notificationMode = stg.notification_mode || 'email';
      const wantsInApp = notificationMode === 'inapp' || notificationMode === 'both';
      const wantsEmail = notificationMode === 'email' || notificationMode === 'both';

      const balances = await base44.asServiceRole.entities.ElectricityBalance.list('-updated_date', 1);
      const bal = balances[0];
      if (!bal) continue;

      const todayStr = new Date().toISOString().split('T')[0];
      const todayLogs = await base44.asServiceRole.entities.DailyConsumptionLog.filter({ log_date: todayStr }, '-created_date', 1);
      const todayKwh = todayLogs[0]?.kwh_used || 0;

      const thresholdKwh = dailyEstimate * (thresholdPercent / 100);
      
      if (todayKwh > thresholdKwh && bal.current_kwh > 0) {
        const userId = stg.created_by_id;
        const user = await base44.asServiceRole.entities.User.list({ id: userId }, null, 1);
        const email = user[0]?.email;
        if (!email && !wantsInApp) continue;

        const daysLeft = dailyEstimate > 0 ? (bal.current_kwh / dailyEstimate).toFixed(1) : '?';
        const subject = `⚡ High Usage Alert: ${todayKwh.toFixed(1)} kWh used today`;
        const body = `Your electricity usage today (${todayKwh.toFixed(1)} kWh) has exceeded your threshold of ${thresholdKwh.toFixed(1)} kWh (${thresholdPercent}% of your daily estimate).

Current balance: ${bal.current_kwh.toFixed(1)} kWh
Estimated days remaining: ${daysLeft} days

Consider reducing usage or reloading soon.

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
            type: 'high_usage',
            title: subject,
            message: body,
            user_id: userId
          });
        }
      }
    }

    return Response.json({ status: 'ok', checked: allSettings.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});