const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * يجمّع قائمة الجلسات إلى فئات زمنية:
 * اليوم، الأمس، هذا الأسبوع، هذا الشهر، الأقدم
 */
export function groupSessionsByDate(sessions) {
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const groups = {
    "اليوم": [],
    "الأمس": [],
    "هذا الأسبوع": [],
    "هذا الشهر": [],
    "الأقدم": [],
  };

  for (const session of sessions) {
    const updated = new Date(session.updated_at);

    if (updated >= today) {
      groups["اليوم"].push(session);
    } else if (updated >= yesterday) {
      groups["الأمس"].push(session);
    } else if (updated >= weekAgo) {
      groups["هذا الأسبوع"].push(session);
    } else if (updated >= monthAgo) {
      groups["هذا الشهر"].push(session);
    } else {
      groups["الأقدم"].push(session);
    }
  }

  return Object.entries(groups).filter(([, items]) => items.length > 0);
}
