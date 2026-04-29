import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { kitchenStyles as styles } from '../components/kitchen-styles';
import { allergySubstitutions, chartSubstitutions } from '../components/sample-data';
import { useAppSettings } from '../contexts/settings-context';

type SectionKey = 'all' | 'allergy' | 'pantry';

const SECTION_TABS: { key: SectionKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'allergy', label: 'Allergy Free' },
  { key: 'pantry', label: 'General Pantry' },
];

const allergyTags = Array.from(new Set(allergySubstitutions.map((item) => item.allergy))).sort();

export default function AllergySubstitutionsScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const { palette } = useAppSettings();
  const [searchText, setSearchText] = useState('');
  const [activeSection, setActiveSection] = useState<SectionKey>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const normalizedSearch = searchText.trim().toLowerCase();

  function handleSectionChange(section: SectionKey) {
    setActiveSection(section);
    setActiveTag(null);
    setSearchText('');
  }

  function handleTagPress(tag: string) {
    setActiveTag((prev) => (prev === tag ? null : tag));
  }

  const showAllergy = activeSection === 'all' || activeSection === 'allergy';
  const showPantry = activeSection === 'all' || activeSection === 'pantry';

  const filteredAllergySubstitutions = useMemo(
    () =>
      allergySubstitutions.filter((item) => {
        const matchesSearch = normalizedSearch
          ? `${item.allergy} ${item.avoid} ${item.swap} ${item.ratio} ${item.notes}`
              .toLowerCase()
              .includes(normalizedSearch)
          : true;
        const matchesTag = activeTag ? item.allergy === activeTag : true;
        return matchesSearch && matchesTag;
      }),
    [normalizedSearch, activeTag]
  );

  const filteredChartSubstitutions = useMemo(
    () =>
      chartSubstitutions.filter((item) =>
        normalizedSearch
          ? `${item.ingredient} ${item.swap} ${item.ratio} ${item.note}`
              .toLowerCase()
              .includes(normalizedSearch)
          : true
      ),
    [normalizedSearch]
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.page}>
        <View
          style={[
            styles.hero,
            isWide && styles.heroWide,
            { backgroundColor: palette.surface, borderColor: palette.borderAlt },
          ]}
        >
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: palette.accentText }]}>Reference page</Text>
            <Text style={[styles.title, { color: palette.text }]}>Common Substitutions</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              This screen is a quick reference for common allergy-aware swaps. It is not medical
              advice, but it gives the app a useful place to start for safer cooking alternatives.
            </Text>
          </View>

          <View style={[styles.heroCard, { backgroundColor: palette.elevatedDark }]}>
            <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Design intention</Text>
            <Text style={[styles.heroCardTitle, { color: palette.inverseText }]}>Helpful and cautious</Text>
            <Text style={[styles.heroCardText, { color: palette.inverseMuted }]}>
              Each card shows what to avoid, what to try instead, the rough ratio, and a short note
              about how the swap behaves.
            </Text>

            {/* Section toggle */}
            <View style={styles.numberGrid}>
              {SECTION_TABS.map((tab) => {
                const isActive = activeSection === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => handleSectionChange(tab.key)}
                    style={[
                      styles.numberButton,
                      { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                      isActive && styles.numberButtonActive,
                      isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                    ]}
                  >
                    <Text style={[styles.numberButtonText, { color: palette.text }]}>{tab.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Allergy type tags */}
            {showAllergy ? (
              <View style={styles.numberGrid}>
                {allergyTags.map((tag) => {
                  const isActive = activeTag === tag;
                  return (
                    <Pressable
                      key={tag}
                      onPress={() => handleTagPress(tag)}
                      style={[
                        styles.numberButton,
                        { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                        isActive && styles.numberButtonActive,
                        isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                      ]}
                    >
                      <Text style={[styles.numberButtonText, { color: palette.text }]}>{tag}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder={isWide ? "Search swaps like dairy, butter, egg, or yogurt" : "Search (dairy, egg…)"}
              placeholderTextColor={palette.searchPlaceholder}
              style={[
                styles.searchInput,
                { backgroundColor: palette.elevated, borderColor: palette.borderAlt, color: palette.text },
              ]}
            />
          </View>
        </View>

        {showAllergy ? (
          <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
            <Text style={[styles.panelTitle, { color: palette.text }]}>
              {activeTag ? `${activeTag} substitutions` : 'Allergy Substitutions'}
            </Text>
            <View style={styles.listStack}>
              {filteredAllergySubstitutions.map((item) => (
                <View
                  key={`${item.allergy}-${item.avoid}`}
                  style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                >
                  <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>{item.allergy}</Text>
                  <Text style={[styles.detailCardTitle, { color: palette.text }]}>{`${item.avoid} → ${item.swap}`}</Text>
                  {item.ratio !== '1 egg replacement' ? (
                    <Text style={[styles.infoCardMeta, { color: palette.text, fontSize: 22 }]}>{item.ratio}</Text>
                  ) : null}
                  <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{item.notes}</Text>
                </View>
              ))}
              {filteredAllergySubstitutions.length === 0 ? (
                <View style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
                  <Text style={[styles.detailCardTitle, { color: palette.text }]}>No allergy swap matches</Text>
                  <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>Try another search term or tag.</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {showPantry ? (
          <View style={[styles.panelAlt, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}>
            <Text style={[styles.panelTitle, { color: palette.text }]}>General Pantry Substitutions</Text>
            <View style={styles.cardStack}>
              {filteredChartSubstitutions.map((substitute) => (
                <View
                  key={substitute.ingredient}
                  style={[styles.infoCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                >
                  <Text style={[styles.infoCardTitle, { color: palette.accentText }]}>{substitute.ingredient}</Text>
                  <Text style={[styles.infoCardSwap, { color: palette.text }]}>{substitute.swap}</Text>
                  <Text style={[styles.infoCardMeta, { color: palette.text, fontSize: 22 }]}>{substitute.ratio}</Text>
                  <Text style={[styles.infoCardBody, { color: palette.textMuted }]}>{substitute.note}</Text>
                </View>
              ))}
              {filteredChartSubstitutions.length === 0 ? (
                <View style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
                  <Text style={[styles.detailCardTitle, { color: palette.text }]}>No pantry substitution matches</Text>
                  <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>Try another search term.</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
