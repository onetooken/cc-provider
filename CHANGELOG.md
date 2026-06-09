# Changelog

## 0.0.4

- Added config schema version tracking so legacy provider migrations run only once.
- Fixed manually edited built-in provider model slots reverting to preset defaults after saving.

## 0.0.3

- Added permission default mode selection with `none`, `auto`, and `bypassPermissions` options.
- Added support for writing `permissions.defaultMode` as `bypassPermissions`.
- Changed built-in providers and new custom providers to avoid managing permission default mode by default.
- Preserved compatibility with older saved configs that used `enableAutoMode`.

## 0.0.2

- Added editable provider presets for DeepSeek, Zhipu GLM Coding Plan, and Xiaomi MiMo Token Plan.
- Added sidebar controls for provider URL, API token, model slots, custom environment variables, and managed behavior settings.
- Added settings preview, SecretStorage token handling, and timestamped settings backups.
