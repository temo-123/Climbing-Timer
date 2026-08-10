import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fetchFeaturedProducts } from '../utils/api';
import { ShopProduct } from '../types/models';

const SHOP_URL = 'https://shop.climbing.ge/';
const MAX_PRODUCTS = 8;

const formatPrice = (value: number, currency: string) =>
  `${Number.isInteger(value) ? value : value.toFixed(2)}${currency}`;

export default function ShopBanner() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchFeaturedProducts(lang)
      .then(data => { if (!cancelled) setProducts(data.slice(0, MAX_PRODUCTS)); })
      .catch(() => { if (!cancelled) setProducts([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [lang]);

  const openShop = () => Linking.openURL(SHOP_URL).catch(() => {});
  const openProduct = (product: ShopProduct) =>
    Linking.openURL(`${SHOP_URL}${lang}/product/${product.urlTitle}`).catch(() => {});

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

      {/* Product cards */}
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#2ed573" />
        </View>
      ) : products.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.productsScroll}
          contentContainerStyle={styles.productsRow}
        >
          {products.map(product => (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => openProduct(product)}
              activeOpacity={0.75}
            >
              {product.imageUrl ? (
                <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="cover" />
              ) : (
                <View style={[styles.productImage, styles.productImagePlaceholder]}>
                  <Text style={styles.placeholderEmoji}>🧗</Text>
                </View>
              )}
              <Text style={styles.cardName} numberOfLines={2}>{product.title}</Text>
              <View style={styles.chipPriceRow}>
                {product.discountedPrice != null ? (
                  <>
                    <Text style={styles.chipPriceOld}>{formatPrice(product.price, product.currency)}</Text>
                    <Text style={styles.chipPrice}>{formatPrice(product.discountedPrice, product.currency)}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.chipPriceFrom}>{t('shop.price_from')}</Text>
                    <Text style={styles.chipPrice}>{formatPrice(product.price, product.currency)}</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

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

  loadingRow: {
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  productsScroll: {
    marginBottom: 14,
  },
  productsRow: {
    gap: 10,
    paddingRight: 2,
  },
  productCard: {
    width: 112,
    backgroundColor: '#152218',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#2ed57322',
  },
  productImage: {
    width: '100%',
    height: 96,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#0d1f1a',
  },
  productImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 28,
  },
  cardName: {
    color: '#ccc',
    fontSize: 11,
    fontWeight: '600',
    minHeight: 28,
    marginBottom: 6,
    lineHeight: 14,
  },
  chipPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 4,
  },
  chipPriceFrom: {
    color: '#6aaa88',
    fontSize: 8,
    fontWeight: '500',
  },
  chipPriceOld: {
    color: '#6a8a78',
    fontSize: 10,
    fontWeight: '500',
    textDecorationLine: 'line-through',
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
