import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CLIMBING_GE_PRODUCTS, localizedProduct } from '../data/climbingGearProducts';

const SHOP_URL = 'https://shop.climbing.ge/products/';

export default function ShopBanner() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const openShop = () => Linking.openURL(SHOP_URL).catch(() => {});

  return (
    <View style={styles.wrapper}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.brandPill}>
          <Text style={styles.brandText}>climbing.ge</Text>
        </View>
        <Text style={styles.badge}>{t('shop.badge')}</Text>
      </View>

      <Text style={styles.title}>{t('shop.title')}</Text>
      <Text style={styles.sub}>{t('shop.sub')}</Text>

      {/* Product chips */}
      <View style={styles.productsRow}>
        {CLIMBING_GE_PRODUCTS.map(product => {
          const loc = localizedProduct(product, lang);
          return (
            <TouchableOpacity
              key={product.id}
              style={styles.productChip}
              onPress={openShop}
              activeOpacity={0.75}
            >
              <Text style={styles.chipEmoji}>{product.emoji}</Text>
              <Text style={styles.chipName} numberOfLines={2}>{loc.name}</Text>
              <View style={styles.chipPriceRow}>
                <Text style={styles.chipPriceFrom}>{t('shop.price_from')}</Text>
                <Text style={styles.chipPrice}>{product.priceRange.split('–')[0]}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.ctaBtn} onPress={openShop} activeOpacity={0.85}>
        <Text style={styles.ctaText}>{t('shop.cta')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#0d1f1a',
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2ed57333',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  brandPill: {
    backgroundColor: '#2ed57322',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#2ed57355',
  },
  brandText: {
    color: '#2ed573',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  badge: {
    color: '#2ed57388',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  sub: {
    color: '#6aaa88',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },

  productsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  productChip: {
    flex: 1,
    backgroundColor: '#152218',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2ed57322',
  },
  chipEmoji: {
    fontSize: 22,
    marginBottom: 5,
  },
  chipName: {
    color: '#ccc',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 13,
  },
  chipPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  chipPriceFrom: {
    color: '#6aaa88',
    fontSize: 8,
    fontWeight: '500',
  },
  chipPrice: {
    color: '#2ed573',
    fontSize: 12,
    fontWeight: '800',
  },

  ctaBtn: {
    backgroundColor: '#2ed573',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  ctaText: {
    color: '#0a1a10',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
