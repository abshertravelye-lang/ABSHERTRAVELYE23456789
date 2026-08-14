const fs = require('fs');
const file = 'artifacts/absher-mobile/components/VisaCard.tsx';
let code = fs.readFileSync(file, 'utf-8');

code = code.replace(
`const CATEGORY_AR: Record<string, string> = {
  tourist: t('visas.category.tourist'), business: t('visas.category.business'), medical: t('visas.category.medical'),
  visit: t('visas.category.visit'), study: t('visas.category.study'), umrah: t('visas.category.umrah'),
};`,
`function getCategoryLabel(t: any, type: string) {
  const map: Record<string, string> = {
    tourist: t('visas.category.tourist'), business: t('visas.category.business'), medical: t('visas.category.medical'),
    visit: t('visas.category.visit'), study: t('visas.category.study'), umrah: t('visas.category.umrah'),
  };
  return map[type] || type;
}`
);

code = code.replace(
`const ENTRY_AR: Record<string, string> = {
  single: t('visas.entry.single'), multiple: t('visas.entry.multiple'), transit: t('visas.entry.transit'),
};`,
`function getEntryLabel(t: any, type: string) {
  const map: Record<string, string> = {
    single: t('visas.entry.single'), multiple: t('visas.entry.multiple'), transit: t('visas.entry.transit'),
  };
  return map[type] || type;
}`
);

code = code.replace(/CATEGORY_AR\[([^\]]+)\]/g, "getCategoryLabel(t, $1)");
code = code.replace(/ENTRY_AR\[([^\]]+)\]/g, "getEntryLabel(t, $1)");

fs.writeFileSync(file, code);
