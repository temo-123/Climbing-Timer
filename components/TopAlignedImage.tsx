import React, { useState } from 'react';
import { Image, View, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { useImageNaturalSize } from '../hooks/useImageNaturalSize';

interface Props {
  uri: string;
  style: StyleProp<ViewStyle>;
}

// Training photos are admin-authored with no fixed aspect ratio or upload
// widget (plain URL field) — many are tall screenshots/diagrams with the
// meaningful content near the top and filler (captions, labels) below.
// RN's `resizeMode="cover"` always crops from the center, which on a photo
// like that cuts straight through the useful part. This fills the box the
// same way `cover` does (no distortion, no letterboxing) but anchors the
// crop to the top edge instead of the center, once the image's real pixel
// size is known — falling back to plain centered `cover` until then.
export default function TopAlignedImage({ uri, style }: Props) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  const natural = useImageNaturalSize(uri);

  let imageStyle: StyleProp<ImageStyle> = StyleSheet.absoluteFill;
  if (natural && box.width > 0 && box.height > 0) {
    const scale = Math.max(box.width / natural.width, box.height / natural.height);
    const renderedWidth = natural.width * scale;
    const renderedHeight = natural.height * scale;
    imageStyle = {
      position: 'absolute', top: 0, left: (box.width - renderedWidth) / 2,
      width: renderedWidth, height: renderedHeight,
    };
  }

  return (
    <View
      style={[style, { overflow: 'hidden' }]}
      onLayout={e => setBox({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      <Image source={{ uri }} style={imageStyle} resizeMode="cover" />
    </View>
  );
}
