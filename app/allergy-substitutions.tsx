import { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { kitchenStyles as styles } from '../components/kitchen-styles';
import { allergySubstitutions, chartSubstitutions } from '../components/sample-data';

export default function AllergySubstitutionsScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.hero, isWide && styles.heroWide]}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Reference page</Text>
            <Text style={styles.title}>Common allergy substitutions</Text>
            <Text style={styles.subtitle}>
              This screen is a quick reference for common allergy-aware swaps. It is not medical
              advice, but it gives the app a useful place to start for safer cooking alternatives.
            </Text>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.heroCardLabel}>Design intention</Text>
            <Text style={styles.heroCardTitle}>Helpful and cautious</Text>
            <Text style={styles.heroCardText}>
              Each card shows what to avoid, what to try instead, the rough ratio, and a short note
              about how the swap behaves.
            </Text>

            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search swaps like dairy, butter, egg, or yogurt"
              placeholderTextColor="#8f775b"
              style={styles.searchInput}
            />
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelEyebrow}>Allergy swaps</Text>
          <Text style={styles.panelTitle}>Starter substitutions by need</Text>
          <View style={styles.listStack}>
            {filteredAllergySubstitutions.map((item) => (
              <View key={`${item.allergy}-${item.avoid}`} style={styles.detailCard}>
                <Text style={styles.detailCardMeta}>{item.allergy}</Text>
                <Text style={styles.detailCardTitle}>{item.avoid}</Text>
                <Text style={styles.infoCardSwap}>{item.swap}</Text>
                <Text style={styles.infoCardMeta}>{item.ratio}</Text>
                <Text style={styles.detailCardBody}>{item.notes}</Text>
              </View>
            ))}
            {filteredAllergySubstitutions.length === 0 ? (
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>No allergy swap matches</Text>
                <Text style={styles.detailCardBody}>Try another search term.</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.panelAlt}>
          <Text style={styles.panelEyebrow}>Chart expansion</Text>
          <Text style={styles.panelTitle}>General pantry substitutions</Text>
          <View style={styles.cardStack}>
            {filteredChartSubstitutions.map((substitute) => (
              <View key={substitute.ingredient} style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>{substitute.ingredient}</Text>
                <Text style={styles.infoCardSwap}>{substitute.swap}</Text>
                <Text style={styles.infoCardMeta}>{substitute.ratio}</Text>
                <Text style={styles.infoCardBody}>{substitute.note}</Text>
              </View>
            ))}
            {filteredChartSubstitutions.length === 0 ? (
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>No pantry substitution matches</Text>
                <Text style={styles.detailCardBody}>Try another search term.</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.panelDark}>
          <Text style={styles.panelDarkEyebrow}>Future improvements</Text>
          <Text style={styles.panelDarkTitle}>Layer allergy logic onto pantry swaps</Text>
          <Text style={styles.panelDarkText}>
            This page now combines allergy-aware swaps with broader pantry substitutions from the
            chart resource. Later we can tag which substitutions are safe for specific allergens and
            which ones are just general ingredient stand-ins.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
