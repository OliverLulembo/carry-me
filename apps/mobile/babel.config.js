module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "react" }]],
    // Worklets / Reanimated v4 plugin is handled automatically by babel-preset-expo in SDK 54.
  };
};
