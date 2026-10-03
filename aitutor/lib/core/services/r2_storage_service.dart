import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/env_config.dart';

class CloudflareR2Service {
  static String get accountId => EnvConfig.r2AccountId;
  static String get accessKeyId => EnvConfig.r2AccessKeyId;
  static String get secretAccessKey => EnvConfig.r2SecretAccessKey;
  static String get bucketName => EnvConfig.r2BucketName;
  static String get publicUrlBase => EnvConfig.r2PublicUrl;

  static bool get isConfigured =>
      accountId.isNotEmpty &&
      accessKeyId.isNotEmpty &&
      secretAccessKey.isNotEmpty;

  /// Uploads a local file to Cloudflare R2 bucket and returns its public URL
  static Future<String?> uploadFile({
    required String remotePath,
    required File file,
    String contentType = 'application/octet-stream',
  }) async {
    if (!await file.exists()) {
      debugPrint("❌ CloudflareR2: File does not exist at ${file.path}");
      return null;
    }
    final bytes = await file.readAsBytes();
    return uploadBytes(
      remotePath: remotePath,
      bytes: bytes,
      contentType: contentType,
    );
  }

  /// Uploads raw bytes to Cloudflare R2 bucket and returns its public URL
  static Future<String?> uploadBytes({
    required String remotePath,
    required Uint8List bytes,
    String contentType = 'application/octet-stream',
  }) async {
    if (!isConfigured) {
      debugPrint("⚠️ CloudflareR2: Credentials not fully configured in .env");
      return null;
    }

    try {
      final key = remotePath.startsWith('/') ? remotePath.substring(1) : remotePath;
      final host = '$accountId.r2.cloudflarestorage.com';
      final path = '/$bucketName/$key';
      final uri = Uri.parse('https://$host$path');

      final now = DateTime.now().toUtc();
      final amzDate = _formatAmzDate(now);
      final dateStamp = _formatDateStamp(now);

      final payloadHash = sha256.convert(bytes).toString();

      final canonicalHeaders = 'host:$host\nx-amz-content-sha256:$payloadHash\nx-amz-date:$amzDate\n';
      const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

      final canonicalRequest = [
        'PUT',
        path,
        '',
        canonicalHeaders,
        signedHeaders,
        payloadHash,
      ].join('\n');

      final region = 'auto';
      final service = 's3';
      final credentialScope = '$dateStamp/$region/$service/aws4_request';

      final stringToSign = [
        'AWS4-HMAC-SHA256',
        amzDate,
        credentialScope,
        sha256.convert(utf8.encode(canonicalRequest)).toString(),
      ].join('\n');

      final signingKey = _getSignatureKey(secretAccessKey, dateStamp, region, service);
      final signature = _hmacHex(signingKey, stringToSign);

      final authorizationHeader =
          'AWS4-HMAC-SHA256 Credential=$accessKeyId/$credentialScope, SignedHeaders=$signedHeaders, Signature=$signature';

      final response = await http.put(
        uri,
        headers: {
          'Host': host,
          'Content-Type': contentType,
          'x-amz-date': amzDate,
          'x-amz-content-sha256': payloadHash,
          'Authorization': authorizationHeader,
        },
        body: bytes,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final finalPublicUrl = publicUrlBase.isNotEmpty
            ? '${publicUrlBase.endsWith('/') ? publicUrlBase.substring(0, publicUrlBase.length - 1) : publicUrlBase}/$key'
            : 'https://pub-$accountId.r2.dev/$key';
        debugPrint("✅ CloudflareR2: Successfully uploaded $key -> $finalPublicUrl");
        return finalPublicUrl;
      } else {
        debugPrint("❌ CloudflareR2 upload failed (${response.statusCode}): ${response.body}");
        return null;
      }
    } catch (e) {
      debugPrint("❌ CloudflareR2 upload error: $e");
      return null;
    }
  }

  static Uint8List _getSignatureKey(String key, String dateStamp, String regionName, String serviceName) {
    final kSecret = utf8.encode('AWS4$key');
    final kDate = _hmac(kSecret, dateStamp);
    final kRegion = _hmac(kDate, regionName);
    final kService = _hmac(kRegion, serviceName);
    final kSigning = _hmac(kService, 'aws4_request');
    return Uint8List.fromList(kSigning);
  }

  static List<int> _hmac(List<int> key, String data) {
    final hmac = Hmac(sha256, key);
    return hmac.convert(utf8.encode(data)).bytes;
  }

  static String _hmacHex(List<int> key, String data) {
    final hmac = Hmac(sha256, key);
    return hmac.convert(utf8.encode(data)).toString();
  }

  static String _formatAmzDate(DateTime dt) {
    return dt.toIso8601String().replaceAll(RegExp(r'[:-]|\.\d+'), '');
  }

  static String _formatDateStamp(DateTime dt) {
    return _formatAmzDate(dt).substring(0, 8);
  }
}
