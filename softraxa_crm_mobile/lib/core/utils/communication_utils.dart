import 'package:url_launcher/url_launcher.dart';

class CommunicationUtils {
  static String formatPhoneNumber(String phone) {
    String cleaned = phone.replaceAll(RegExp(r'[^\d+]'), '');
    if (!cleaned.startsWith('+')) {
      cleaned = '+91$cleaned';
    }
    return cleaned;
  }

  static Future<void> launchCall(String phone) async {
    final cleanPhone = formatPhoneNumber(phone);
    final Uri url = Uri.parse('tel:$cleanPhone');
    try {
      await launchUrl(url);
    } catch (_) {
      // If direct launch fails, try with canLaunchUrl check
      if (await canLaunchUrl(url)) {
        await launchUrl(url);
      }
    }
  }

  static Future<void> launchWhatsApp(
    String phone, {
    String message = '',
  }) async {
    final cleanPhone = formatPhoneNumber(phone).replaceAll('+', '');
    // Try WhatsApp deep link first, fall back to wa.me web
    final Uri whatsappUri = Uri.parse(
      'whatsapp://send?phone=$cleanPhone&text=${Uri.encodeComponent(message)}',
    );
    final Uri waWebUri = Uri.parse(
      'https://wa.me/$cleanPhone?text=${Uri.encodeComponent(message)}',
    );

    try {
      if (await canLaunchUrl(whatsappUri)) {
        await launchUrl(whatsappUri, mode: LaunchMode.externalApplication);
      } else {
        await launchUrl(waWebUri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {
      await launchUrl(waWebUri, mode: LaunchMode.externalApplication);
    }
  }

  static Future<void> launchEmail(String email) async {
    final Uri url = Uri.parse('mailto:$email');
    try {
      await launchUrl(url);
    } catch (_) {
      if (await canLaunchUrl(url)) {
        await launchUrl(url);
      }
    }
  }

  static Future<void> openUrl(String url) async {
    String formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://$formattedUrl';
    }

    final Uri uri = Uri.parse(formattedUrl);
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    }
  }
}
