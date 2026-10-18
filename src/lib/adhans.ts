export type Adhan = {
  id: string;
  name: string;
  nameFa: string;
  reciter: string;
};

export const adhans: Adhan[] = [
  { id: 'default', name: 'Default Adhan', nameFa: 'اذان افقی', reciter: 'مجموعه افقی' },
  { id: 'makkah', name: 'Makkah Adhan', nameFa: 'اذان مکه', reciter: 'مسجدالحرام' },
  { id: 'madinah', name: 'Madinah Adhan', nameFa: 'اذان مدینه', reciter: 'مسجد النبی' },
  { id: 'shia_traditional', name: 'Shia Traditional', nameFa: 'اذان شیعی سنتی', reciter: 'نوهه‌خوانان' },
];
