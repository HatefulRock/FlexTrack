// Android caps AsyncStorage's SQLite database at 6 MB by default; once full, every save fails.
// Workout history grows for years, so raise the cap. iOS stores files and has no such limit.
const { withGradleProperties } = require('expo/config-plugins');

const KEY = 'AsyncStorage_db_size_in_MB';

module.exports = (config, { sizeMB = 64 } = {}) => withGradleProperties(config, mod => {
  mod.modResults = mod.modResults.filter(item => !(item.type === 'property' && item.key === KEY));
  mod.modResults.push({ type: 'property', key: KEY, value: String(sizeMB) });
  return mod;
});
