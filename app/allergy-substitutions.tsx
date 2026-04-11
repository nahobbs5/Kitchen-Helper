import { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { kitchenStyles as styles } from '../components/kitchen-styles';
import { allergySubstitutions, chartSubstitutions } from '../components/sample-data';
import { useAppSettings } from '../contexts/settings-context';

export default function AllergySubstitutionsScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const { palette } = useAppSettings();
  const [searchText, setSearchText] = useState('');
  const normalizedSearch = searchText.trim().toLowerCase();

  const filteredAllergySubstitutions = useMemo(
    () =>
      allergySubstitutions.filter((item) =>
        normalizedSearch
          ? `${item.allergy} ${item.avoid} ${item.swap} ${item.ratio} ${item.notes}`
              .toLowerCase()
              .includes(normalizedSearch)
          : true
      ),
    [normalizedSearch]
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
            <Text style={[styles.title, { color: palette.text }]}>Common allergy substitutions</Text>
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

            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search swaps like dairy, butter, egg, or yogurt"
              placeholderTextColor={palette.searchPlaceholder}
              style={[
                styles.searchInput,
                { backgroundColor: palette.elevated, borderColor: palette.borderAlt, color: palette.text },
              ]}
            />
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
          <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Allergy swaps</Text>
          <Text style={[styles.panelTitle, { color: palette.text }]}>Starter substitutions by need</Text>
          <View style={styles.listStack}>
            {filteredAllergySubstitutions.map((item) => (
              <View
                key={`${item.allergy}-${item.avoid}`}
                style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
              >
                <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>{item.allergy}</Text>
                <Text style={[styles.detailCardTitle, { color: palette.text }]}>{item.avoid}</Text>
                <Text style={[styles.infoCardSwap, { color: palette.text }]}>{item.swap}</Text>
                <Text style={[styles.infoCardMeta, { color: palette.accentText }]}>{item.ratio}</Text>
                <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{item.notes}</Text>
              </View>
            ))}
            {filteredAllergySubstitutions.length === 0 ? (
              <View style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
                <Text style={[styles.detailCardTitle, { color: palette.text }]}>No allergy swap matches</Text>
                <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>Try another search term.</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.panelAlt, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}>
          <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Chart expansion</Text>
          <Text style={[styles.panelTitle, { color: palette.text }]}>General pantry substitutions</Text>
          <View style={styles.cardStack}>
            {filteredChartSubstitutions.map((substitute) => (
              <View
                key={substitute.ingredient}
                style={[styles.infoCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
              >
                <Text style={[styles.infoCardTitle, { color: palette.accentText }]}>{substitute.ingredient}</Text>
                <Text style={[styles.infoCardSwap, { color: palette.text }]}>{substitute.swap}</Text>
                <Text style={[styles.infoCardMeta, { color: palette.accentText }]}>{substitute.ratio}</Text>
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

        <View style={[styles.panelDark, { backgroundColor: palette.elevatedDark }]}>
          <Text style={[styles.panelDarkEyebrow, { color: palette.accentSoft }]}>Future improvements</Text>
          <Text style={[styles.panelDarkTitle, { color: palette.inverseText }]}>
            Layer allergy logic onto pantry swaps
          </Text>
          <Text style={[styles.panelDarkText, { color: palette.inverseMuted }]}>
            This page now combines allergy-aware swaps with broader pantry substitutions from the
            chart resource. Later we can tag which substitutions are safe for specific allergens and
            which ones are just general ingredient stand-ins.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
