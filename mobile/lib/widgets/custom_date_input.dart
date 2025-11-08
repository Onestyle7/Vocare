import 'package:flutter/material.dart';

class CustomDateInput extends StatelessWidget {
  final String label;
  final String hintText;
  final TextEditingController controller;
  final Color borderColor;
  final double borderRadius;
  final EdgeInsetsGeometry padding;
  final Color fillColor;
  final Color textColor;
  final bool enabled;

  const CustomDateInput({
    super.key,
    required this.label,
    required this.hintText,
    required this.controller,
    this.borderColor = const Color(0xFF915EFF),
    this.borderRadius = 25,
    this.padding = const EdgeInsets.all(16),
    this.fillColor = const Color(0xFF191A23),
    this.textColor = Colors.white,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding,
      child: TextField(
        controller: controller,
        style: TextStyle(color: textColor),
        enabled: enabled,
        readOnly: true, // Tylko kalendarz, nie można pisać ręcznie
        onTap: enabled ? () => _selectDate(context) : null,
        decoration: InputDecoration(
          labelText: label,
          hintText: hintText,
          hintStyle: TextStyle(color: textColor.withOpacity(0.6)),
          labelStyle: TextStyle(color: textColor),
          suffixIcon: Icon(
            Icons.calendar_today,
            color: enabled ? borderColor : Colors.grey,
          ),
          filled: true,
          fillColor: enabled ? fillColor : fillColor.withOpacity(0.5),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(borderRadius),
            borderSide: BorderSide(color: borderColor, width: 2),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(borderRadius),
            borderSide: BorderSide(color: borderColor, width: 2),
          ),
          disabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(borderRadius),
            borderSide: BorderSide(color: Colors.grey, width: 1),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(borderRadius),
            borderSide: BorderSide(color: borderColor, width: 2),
          ),
        ),
      ),
    );
  }

  Future<void> _selectDate(BuildContext context) async {
    // Parsuj obecną datę z kontrolera jeśli istnieje
    DateTime? initialDate;
    if (controller.text.isNotEmpty) {
      try {
        initialDate = DateTime.parse(controller.text);
      } catch (e) {
        initialDate = DateTime.now();
      }
    } else {
      initialDate = DateTime.now();
    }

    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(1950),
      lastDate: DateTime.now().add(
        const Duration(days: 365 * 10),
      ), // 10 lat w przyszłość
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF915EFF), // Kolor nagłówka
              onPrimary: Colors.white,
              surface: Color(0xFF1C1C1E), // Tło kalendarza
              onSurface: Colors.white,
            ),
            dialogBackgroundColor: const Color(0xFF1C1C1E),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      // Formatuj datę jako YYYY-MM-DD
      final formattedDate = _formatDate(picked);
      controller.text = formattedDate;
    }
  }

  String _formatDate(DateTime date) {
    // Format: YYYY-MM-DD
    final year = date.year.toString();
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '$year-$month-$day';
  }
}

// Widget dla checkboxa "Currently here"
class CurrentlyHereCheckbox extends StatelessWidget {
  final String label;
  final bool value;
  final ValueChanged<bool?> onChanged;

  const CurrentlyHereCheckbox({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Checkbox(
            value: value,
            onChanged: onChanged,
            activeColor: const Color(0xFF915EFF),
            checkColor: Colors.white,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(color: Colors.white, fontSize: 16),
            ),
          ),
        ],
      ),
    );
  }
}
