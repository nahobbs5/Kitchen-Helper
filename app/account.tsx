import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { kitchenStyles as styles } from '../components/kitchen-styles';
import { ProgressBar } from '../components/progress-bar';
import { useAuth } from '../contexts/auth-context';
import { useCustomRecipes } from '../contexts/custom-recipes-context';
import { useRatings } from '../contexts/ratings-context';
import { useAppSettings } from '../contexts/settings-context';
import { buildExportRecipes, exportRecipesToPdf } from '../utils/export-recipes';
import { parseRecipeTimeMinutes } from '../utils/recipe-metadata';

const timeThresholdOptions = [15, 30, 60] as const;

export default function AccountScreen() {
  const { palette, showRatingsInCardExports } = useAppSettings();
  const { ratings } = useRatings();
  const webAccountControlWidth = Platform.OS === 'web' ? ({ width: '30%' } as const) : null;
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [passwordResetEmail, setPasswordResetEmail] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportState, setExportState] = useState<'idle' | 'all' | 'filtered'>('idle');
  const isExporting = exportState !== 'idle';
  const [selectedExportCategories, setSelectedExportCategories] = useState<string[]>([]);
  const [selectedExportFriendlyTags, setSelectedExportFriendlyTags] = useState<string[]>([]);
  const [selectedExportAllergenTags, setSelectedExportAllergenTags] = useState<string[]>([]);
  const [selectedCookThresholds, setSelectedCookThresholds] = useState<number[]>([]);
  const [selectedPrepThresholds, setSelectedPrepThresholds] = useState<number[]>([]);
  const [customCookThreshold, setCustomCookThreshold] = useState('');
  const [customPrepThreshold, setCustomPrepThreshold] = useState('');
  const [useCustomCookThreshold, setUseCustomCookThreshold] = useState(false);
  const [useCustomPrepThreshold, setUseCustomPrepThreshold] = useState(false);
  const {
    authError,
    authMessage,
    clearAuthFeedback,
    configured: authConfigured,
    isAuthenticating,
    requestPasswordReset,
    signIn,
    signOut,
    signUp,
    user,
  } = useAuth();
  const {
    clearSyncError,
    customRecipes,
    loaded,
    recipeOverrideMap,
    refreshSync,
    syncBusy,
    syncEnabled,
    syncError,
  } = useCustomRecipes();

  const exportRecipes = useMemo(
    () =>
      buildExportRecipes({
        customRecipes,
        recipeOverrideMap,
        ratings,
        showRatings: showRatingsInCardExports,
      }),
    [customRecipes, recipeOverrideMap, ratings, showRatingsInCardExports]
  );
  const exportCategoryOptions = useMemo(
    () => buildCountOptions(exportRecipes.map((recipe) => recipe.category)),
    [exportRecipes]
  );
  const exportFriendlyTagOptions = useMemo(
    () => buildCountOptions(exportRecipes.flatMap((recipe) => recipe.allergyFriendlyTags)),
    [exportRecipes]
  );
  const exportAllergenTagOptions = useMemo(
    () => buildCountOptions(exportRecipes.flatMap((recipe) => recipe.allergenTags)),
    [exportRecipes]
  );
  const parsedCustomCookThreshold = parseCustomThreshold(customCookThreshold);
  const parsedCustomPrepThreshold = parseCustomThreshold(customPrepThreshold);
  const activeCookThresholds = useMemo(
    () =>
      parsedCustomCookThreshold === null || !useCustomCookThreshold
        ? selectedCookThresholds
        : [...selectedCookThresholds, parsedCustomCookThreshold],
    [parsedCustomCookThreshold, selectedCookThresholds, useCustomCookThreshold]
  );
  const activePrepThresholds = useMemo(
    () =>
      parsedCustomPrepThreshold === null || !useCustomPrepThreshold
        ? selectedPrepThresholds
        : [...selectedPrepThresholds, parsedCustomPrepThreshold],
    [parsedCustomPrepThreshold, selectedPrepThresholds, useCustomPrepThreshold]
  );
  const filteredExportRecipes = useMemo(
    () =>
      exportRecipes.filter((recipe) => {
        if (
          selectedExportCategories.length > 0 &&
          !selectedExportCategories.includes(recipe.category)
        ) {
          return false;
        }

        if (
          selectedExportFriendlyTags.length > 0 &&
          !selectedExportFriendlyTags.some((tag) => recipe.allergyFriendlyTags.includes(tag))
        ) {
          return false;
        }

        if (
          selectedExportAllergenTags.length > 0 &&
          !selectedExportAllergenTags.some((tag) => recipe.allergenTags.includes(tag))
        ) {
          return false;
        }

        if (activeCookThresholds.length > 0) {
          const cookMinutes = parseRecipeTimeMinutes(recipe.cookTime);

          if (cookMinutes === null || !activeCookThresholds.some((threshold) => cookMinutes <= threshold)) {
            return false;
          }
        }

        if (activePrepThresholds.length > 0) {
          const prepMinutes = parseRecipeTimeMinutes(recipe.prepTime);

          if (prepMinutes === null || !activePrepThresholds.some((threshold) => prepMinutes <= threshold)) {
            return false;
          }
        }

        return true;
      }),
    [
      activeCookThresholds,
      activePrepThresholds,
      exportRecipes,
      selectedExportAllergenTags,
      selectedExportCategories,
      selectedExportFriendlyTags,
    ]
  );
  const hasExportFilters =
    selectedExportCategories.length > 0 ||
    selectedExportFriendlyTags.length > 0 ||
    selectedExportAllergenTags.length > 0 ||
    activeCookThresholds.length > 0 ||
    activePrepThresholds.length > 0;

  useEffect(() => {
    return () => {
      setAuthPassword('');
    };
  }, []);

  async function handleSignIn() {
    clearAuthFeedback();
    clearSyncError();
    await signIn(authEmail, authPassword);
    setAuthPassword('');
  }

  async function handleSignUp() {
    clearAuthFeedback();
    clearSyncError();
    await signUp(authEmail, authPassword);
    setAuthPassword('');
  }

  async function handlePasswordReset() {
    clearAuthFeedback();
    clearSyncError();
    const sent = await requestPasswordReset(passwordResetEmail);
    if (sent) {
      setPasswordResetEmail('');
    }
  }

  async function handleExportRecipes() {
    if (isExporting || !loaded) return;
    setExportError(null);
    setExportMessage(null);
    setExportState('all');
    try {
      const result = await exportRecipesToPdf(exportRecipes);
      setExportMessage(result.message);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : 'Recipe export failed. Please try again.'
      );
    } finally {
      setExportState('idle');
    }
  }

  async function handleExportFilteredRecipes() {
    if (isExporting || !loaded || filteredExportRecipes.length === 0) return;
    setExportError(null);
    setExportMessage(null);
    setExportState('filtered');
    try {
      const result = await exportRecipesToPdf(filteredExportRecipes);
      setExportMessage(result.message);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : 'Recipe export failed. Please try again.'
      );
    } finally {
      setExportState('idle');
    }
  }

  async function handleSignOut() {
    clearAuthFeedback();
    clearSyncError();
    await signOut();
  }

  function toggleSelectedValue(value: string, setter: (updater: (current: string[]) => string[]) => void) {
    setter((current) =>
      current.includes(value) ? current.filter((currentValue) => currentValue !== value) : [...current, value]
    );
  }

  function toggleSelectedThreshold(value: number, setter: (updater: (current: number[]) => number[]) => void) {
    setter((current) =>
      current.includes(value) ? current.filter((currentValue) => currentValue !== value) : [...current, value]
    );
  }

  function renderCheckboxRow(label: string, count: number | null, active: boolean, onPress: () => void) {
    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.settingsRow,
          {
            alignItems: 'center',
            borderColor: active ? palette.accent : palette.borderAlt,
            borderRadius: 14,
            borderWidth: 1,
            backgroundColor: active ? palette.elevatedAlt : palette.surface,
            paddingHorizontal: 12,
            paddingVertical: 10,
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
          <Text style={{ color: active ? palette.accentText : palette.text, fontSize: 18, fontWeight: '800' }}>
            {active ? '☑' : '☐'}
          </Text>
          <Text style={[styles.settingsHint, { color: palette.text, flex: 1, fontWeight: '700' }]}>
            {label}
          </Text>
        </View>
        {count === null ? null : (
          <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
            {count}
          </Text>
        )}
      </Pressable>
    );
  }

  return (
    <ScrollView
      style={[styles.settingsScroll, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.settingsScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.settingsSection,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            marginTop: 16,
            marginBottom: 16,
          },
        ]}
      >
        <Text style={[styles.settingsSectionTitle, { color: palette.text }]}>Account Sync</Text>
        <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
          Sign in to sync recipes across devices.
        </Text>
        {!authConfigured ? (
          <View style={styles.settingsCopy}>
            <Text style={[styles.settingsLabel, { color: palette.text }]}>Sync setup required</Text>
            <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
              Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to your Expo
              environment before account sync can run.
            </Text>
          </View>
        ) : user ? (
          <>
            <View style={styles.settingsCopy}>
              <Text style={[styles.settingsLabel, { color: palette.text }]}>Signed in</Text>
              <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
                {user.email ?? 'Authenticated account'} is the active sync account for recipes and
                recipe overrides.
              </Text>
              <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
                {syncBusy ? 'Syncing changes now.' : 'New recipe changes will sync across devices.'}
              </Text>
              {syncEnabled ? (
                <Pressable
                  disabled={syncBusy}
                  onPress={() => {
                    void refreshSync();
                  }}
                  style={{ alignSelf: 'flex-start', opacity: syncBusy ? 0.65 : 1 }}
                >
                  <Text style={[styles.menuCardLink, { color: palette.accentText }]}>
                    {syncBusy ? 'Syncing...' : 'Refresh sync'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            <Pressable
              onPress={handleSignOut}
              disabled={isAuthenticating}
              style={[
                styles.secondaryButton,
                webAccountControlWidth,
                {
                  backgroundColor: palette.elevatedAlt,
                  borderColor: palette.borderAlt,
                  opacity: isAuthenticating ? 0.5 : 1,
                },
              ]}
            >
              <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>Sign out</Text>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              value={authEmail}
              onChangeText={setAuthEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={palette.textMuted}
              style={[
                styles.formInput,
                webAccountControlWidth,
                {
                  backgroundColor: palette.elevatedAlt,
                  borderColor: palette.borderAlt,
                  color: palette.text,
                },
              ]}
            />
            <TextInput
              value={authPassword}
              onChangeText={setAuthPassword}
              secureTextEntry
              placeholder="Password"
              placeholderTextColor={palette.textMuted}
              style={[
                styles.formInput,
                webAccountControlWidth,
                {
                  backgroundColor: palette.elevatedAlt,
                  borderColor: palette.borderAlt,
                  color: palette.text,
                },
              ]}
            />
            <View style={styles.actionRow}>
              <Pressable
                onPress={handleSignIn}
                disabled={isAuthenticating || !authEmail.trim() || !authPassword}
                style={[
                  styles.primaryButton,
                  webAccountControlWidth,
                  {
                    backgroundColor:
                      isAuthenticating || !authEmail.trim() || !authPassword
                        ? palette.borderAlt
                        : palette.accent,
                  },
                ]}
              >
                <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>
                  {isAuthenticating ? 'Working…' : 'Sign in'}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSignUp}
                disabled={isAuthenticating || !authEmail.trim() || !authPassword}
                style={[
                  styles.secondaryButton,
                  webAccountControlWidth,
                  {
                    backgroundColor: palette.elevatedAlt,
                    borderColor: palette.borderAlt,
                    opacity: isAuthenticating || !authEmail.trim() || !authPassword ? 0.5 : 1,
                  },
                ]}
              >
                <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>
                  Create account
                </Text>
              </Pressable>
            </View>
            <View style={styles.settingsCopy}>
              <Text style={[styles.settingsLabel, { color: palette.text }]}>Forgot password</Text>
              <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
                Send a password reset email to your account address.
              </Text>
            </View>
            <Pressable
              onPress={() => {
                clearAuthFeedback();
                clearSyncError();
                setShowPasswordReset((current) => !current);
              }}
              disabled={isAuthenticating}
              style={[
                styles.secondaryButton,
                webAccountControlWidth,
                {
                  backgroundColor: palette.elevatedAlt,
                  borderColor: palette.borderAlt,
                  opacity: isAuthenticating ? 0.5 : 1,
                },
              ]}
            >
              <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>
                {showPasswordReset ? 'Hide recovery' : 'Forgot password'}
              </Text>
            </Pressable>
            {showPasswordReset ? (
              <>
                <TextInput
                  value={passwordResetEmail}
                  onChangeText={setPasswordResetEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="Account email"
                  placeholderTextColor={palette.textMuted}
                  style={[
                    styles.formInput,
                    webAccountControlWidth,
                    {
                      backgroundColor: palette.elevatedAlt,
                      borderColor: palette.borderAlt,
                      color: palette.text,
                    },
                  ]}
                />
                <Pressable
                  onPress={handlePasswordReset}
                  disabled={isAuthenticating || !passwordResetEmail.trim()}
                  style={[
                    styles.primaryButton,
                    webAccountControlWidth,
                    {
                      backgroundColor:
                        isAuthenticating || !passwordResetEmail.trim()
                          ? palette.borderAlt
                          : palette.accent,
                    },
                  ]}
                >
                  <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>
                    {isAuthenticating ? 'Working…' : 'Send reset email'}
                  </Text>
                </Pressable>
              </>
            ) : null}
          </>
        )}
        {authMessage ? (
          <Text style={[styles.settingsHint, { color: palette.accentText }]}>{authMessage}</Text>
        ) : null}
        {authError ? (
          <Text style={[styles.settingsHint, { color: '#b14c2f' }]}>{authError}</Text>
        ) : null}
        {syncError ? (
          <Text style={[styles.settingsHint, { color: '#b14c2f' }]}>{syncError}</Text>
        ) : null}
      </View>

      <View
        style={[
          styles.settingsSection,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            marginTop: 16,
            marginBottom: 16,
          },
        ]}
      >
        <Text style={[styles.settingsSectionTitle, { color: palette.text }]}>Export</Text>
        <View style={[styles.settingsCopy, { flexBasis: 'auto', flexGrow: 0, flexShrink: 0 }]}>
          <Text style={[styles.settingsLabel, { color: palette.text }]}>Export all recipes to PDF</Text>
          <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
            Create one cookbook-style PDF from your full library.
          </Text>
          <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
            {exportRecipes.length} recipe{exportRecipes.length === 1 ? '' : 's'} ready to export.
          </Text>
        </View>
        <Pressable
          onPress={handleExportRecipes}
          disabled={isExporting || !loaded}
          style={[
            styles.settingsCloseButton,
            webAccountControlWidth,
            {
              backgroundColor: isExporting || !loaded ? palette.borderAlt : palette.accent,
            },
          ]}
        >
          <Text style={[styles.settingsCloseText, { color: palette.accentContrastText }]}>
            {isExporting ? 'Exporting…' : 'Export all recipes to PDF'}
          </Text>
        </Pressable>
        {exportState === 'all' ? (
          <View style={{ marginTop: 10 }}>
            <ProgressBar palette={palette} accessibilityLabel="Exporting recipes to PDF" />
          </View>
        ) : null}
        <View style={[styles.settingsCopy, { flexBasis: 'auto', flexGrow: 0, flexShrink: 0, gap: 10 }]}>
          <Text style={[styles.settingsLabel, { color: palette.text }]}>Export selected recipes to PDF</Text>
          <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
            Filter the full library by recipe type, tags, and time before exporting.
          </Text>
          <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
            {hasExportFilters
              ? `${filteredExportRecipes.length} recipe${filteredExportRecipes.length === 1 ? '' : 's'} match these filters.`
              : 'Choose one or more filters to build a selected export.'}
          </Text>

          {exportCategoryOptions.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Text style={[styles.formLabel, { color: palette.accentText }]}>Recipe type</Text>
              {exportCategoryOptions.map((option) =>
                renderCheckboxRow(
                  option.name,
                  option.count,
                  selectedExportCategories.includes(option.name),
                  () => toggleSelectedValue(option.name, setSelectedExportCategories)
                )
              )}
            </View>
          ) : null}

          {exportFriendlyTagOptions.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Text style={[styles.formLabel, { color: palette.accentText }]}>Allergy-friendly tags</Text>
              {exportFriendlyTagOptions.map((option) =>
                renderCheckboxRow(
                  option.name,
                  option.count,
                  selectedExportFriendlyTags.includes(option.name),
                  () => toggleSelectedValue(option.name, setSelectedExportFriendlyTags)
                )
              )}
            </View>
          ) : null}

          {exportAllergenTagOptions.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Text style={[styles.formLabel, { color: palette.accentText }]}>Allergen tags</Text>
              {exportAllergenTagOptions.map((option) =>
                renderCheckboxRow(
                  option.name,
                  option.count,
                  selectedExportAllergenTags.includes(option.name),
                  () => toggleSelectedValue(option.name, setSelectedExportAllergenTags)
                )
              )}
            </View>
          ) : null}

          <View style={{ gap: 8 }}>
            <Text style={[styles.formLabel, { color: palette.accentText }]}>Cook time</Text>
            {timeThresholdOptions.map((threshold) =>
              renderCheckboxRow(
                `Under ${threshold} minutes`,
                countRecipesUnderThreshold(exportRecipes, 'cookTime', threshold),
                selectedCookThresholds.includes(threshold),
                () => toggleSelectedThreshold(threshold, setSelectedCookThresholds)
              )
            )}
            {parsedCustomCookThreshold === null ? null : renderCheckboxRow(
              `Under ${parsedCustomCookThreshold} minutes`,
              countRecipesUnderThreshold(exportRecipes, 'cookTime', parsedCustomCookThreshold),
              useCustomCookThreshold,
              () => setUseCustomCookThreshold((current) => !current)
            )}
            <TextInput
              value={customCookThreshold}
              onChangeText={(value) => {
                setCustomCookThreshold(value);
                if (parseCustomThreshold(value) === null) {
                  setUseCustomCookThreshold(false);
                }
              }}
              keyboardType="number-pad"
              placeholder="Custom cook time"
              placeholderTextColor={palette.textMuted}
              style={[
                styles.formInput,
                {
                  backgroundColor: palette.elevatedAlt,
                  borderColor: parsedCustomCookThreshold === null && customCookThreshold.trim() ? '#b14c2f' : palette.borderAlt,
                  color: palette.text,
                },
              ]}
            />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={[styles.formLabel, { color: palette.accentText }]}>Prep time</Text>
            {timeThresholdOptions.map((threshold) =>
              renderCheckboxRow(
                `Under ${threshold} minutes`,
                countRecipesUnderThreshold(exportRecipes, 'prepTime', threshold),
                selectedPrepThresholds.includes(threshold),
                () => toggleSelectedThreshold(threshold, setSelectedPrepThresholds)
              )
            )}
            {parsedCustomPrepThreshold === null ? null : renderCheckboxRow(
              `Under ${parsedCustomPrepThreshold} minutes`,
              countRecipesUnderThreshold(exportRecipes, 'prepTime', parsedCustomPrepThreshold),
              useCustomPrepThreshold,
              () => setUseCustomPrepThreshold((current) => !current)
            )}
            <TextInput
              value={customPrepThreshold}
              onChangeText={(value) => {
                setCustomPrepThreshold(value);
                if (parseCustomThreshold(value) === null) {
                  setUseCustomPrepThreshold(false);
                }
              }}
              keyboardType="number-pad"
              placeholder="Custom prep time"
              placeholderTextColor={palette.textMuted}
              style={[
                styles.formInput,
                {
                  backgroundColor: palette.elevatedAlt,
                  borderColor: parsedCustomPrepThreshold === null && customPrepThreshold.trim() ? '#b14c2f' : palette.borderAlt,
                  color: palette.text,
                },
              ]}
            />
          </View>
        </View>
        <Pressable
          onPress={handleExportFilteredRecipes}
          disabled={isExporting || !loaded || !hasExportFilters || filteredExportRecipes.length === 0}
          style={[
            styles.settingsCloseButton,
            webAccountControlWidth,
            {
              backgroundColor:
                isExporting || !loaded || !hasExportFilters || filteredExportRecipes.length === 0
                  ? palette.borderAlt
                  : palette.accent,
            },
          ]}
        >
          <Text style={[styles.settingsCloseText, { color: palette.accentContrastText }]}>
            {isExporting ? 'Exporting…' : 'Export selected recipes to PDF'}
          </Text>
        </Pressable>
        {exportState === 'filtered' ? (
          <View style={{ marginTop: 10 }}>
            <ProgressBar palette={palette} accessibilityLabel="Exporting selected recipes to PDF" />
          </View>
        ) : null}
        {exportMessage ? (
          <Text style={[styles.settingsHint, { color: palette.accentText }]}>{exportMessage}</Text>
        ) : null}
        {exportError ? (
          <Text style={[styles.settingsHint, { color: '#b14c2f' }]}>{exportError}</Text>
        ) : null}
      </View>

      <View
        style={[
          styles.settingsSection,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            marginTop: 16,
          },
        ]}
      >
        <Text style={[styles.settingsSectionTitle, { color: palette.text }]}>Recipe importer</Text>
        <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
          Known compatibility with the website importer.
        </Text>

        <View style={{ gap: 4 }}>
          <Text style={[styles.settingsLabel, { color: palette.text }]}>Full</Text>
          {[
            'allrecipes.com',
            'cooking.nytimes.com',
            'food.com',
            'littlesweetbaker.com',
            'nutrition.gov',
            'recipetineats.com',
            'simplyrecipes.com',
            'tinykitchendivas.com',
          ].map((site) => (
            <Text key={site} style={[styles.settingsHint, { color: palette.textMuted }]}>
              {site}
            </Text>
          ))}
        </View>

        <View style={{ gap: 4, marginTop: 12 }}>
          <Text style={[styles.settingsLabel, { color: palette.text }]}>Limited</Text>
          {[
            'seriouseats.com',
            'smittenkitchen.com',
          ].map((site) => (
            <Text key={site} style={[styles.settingsHint, { color: palette.textMuted }]}>
              {site}
            </Text>
          ))}
        </View>

        <View style={{ gap: 4, marginTop: 12 }}>
          <Text style={[styles.settingsLabel, { color: palette.text }]}>Doesn't Work</Text>
          {[
            'inspiredtaste.net',
            'therealfooddietitians.com',
          ].map((site) => (
            <Text key={site} style={[styles.settingsHint, { color: palette.textMuted }]}>
              {site}
            </Text>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function buildCountOptions(values: string[]) {
  return Object.entries(
    values.reduce<Record<string, number>>((groups, value) => {
      groups[value] = (groups[value] ?? 0) + 1;
      return groups;
    }, {})
  )
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, count]) => ({ name, count }));
}

function parseCustomThreshold(value: string) {
  if (!value.trim()) {
    return null;
  }

  const threshold = Number(value);

  return Number.isFinite(threshold) && threshold > 0 ? threshold : null;
}

function countRecipesUnderThreshold(
  recipes: ReturnType<typeof buildExportRecipes>,
  field: 'cookTime' | 'prepTime',
  threshold: number
) {
  return recipes.filter((recipe) => {
    const minutes = parseRecipeTimeMinutes(recipe[field]);
    return minutes !== null && minutes <= threshold;
  }).length;
}
