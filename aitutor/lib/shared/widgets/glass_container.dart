import 'dart:ui';
import 'package:flutter/material.dart';

class GlassContainer extends StatelessWidget {
  final Widget child;
  final double? width;
  final double? height;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final double blur;
  final Color? opacityColor;
  final double opacity;
  final Color? borderColor;
  final double borderWidth;
  final List<BoxShadow>? boxShadow;
  final VoidCallback? onTap;
  final Gradient? gradient;

  const GlassContainer({
    super.key,
    required this.child,
    this.width,
    this.height,
    this.padding,
    this.margin,
    this.borderRadius = 20.0,
    this.blur = 16.0,
    this.opacityColor,
    this.opacity = 0.15,
    this.borderColor,
    this.borderWidth = 1.2,
    this.boxShadow,
    this.onTap,
    this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final baseColor = opacityColor ?? (isDark ? Colors.white : Colors.white);
    final effectiveOpacity = opacityColor != null
        ? opacity
        : (isDark ? 0.08 : 0.45);

    final effectiveBorderColor = borderColor ??
        (isDark
            ? Colors.white.withValues(alpha: 0.18)
            : Colors.white.withValues(alpha: 0.65));

    final effectiveBoxShadow = boxShadow ??
        [
          BoxShadow(
            color: isDark
                ? Colors.black.withValues(alpha: 0.35)
                : Colors.indigo.withValues(alpha: 0.08),
            blurRadius: 20,
            spreadRadius: -2,
            offset: const Offset(0, 8),
          ),
        ];

    Widget body = Container(
      width: width,
      height: height,
      padding: padding,
      decoration: BoxDecoration(
        color: baseColor.withValues(alpha: effectiveOpacity),
        gradient: gradient,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: effectiveBorderColor,
          width: borderWidth,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(borderRadius),
        child: child,
      ),
    );

    if (onTap != null) {
      body = Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(borderRadius),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(borderRadius),
          child: body,
        ),
      );
    }

    return Container(
      margin: margin,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        boxShadow: effectiveBoxShadow,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
          child: body,
        ),
      ),
    );
  }
}
