import 'package:flutter/material.dart';
import 'package:vocare/widgets/nav_bar_button.dart';
import 'package:vocare/widgets/theme_toggle_button.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
      backgroundColor: Colors.black87,
  automaticallyImplyLeading: false, // usuwa strzałkę "wstecz"
  toolbarHeight: 60,
 
  flexibleSpace: SafeArea(
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: const [
          ThemeToggleButton(),
          NavBarButtons(
            destinations: [
              NavDestination.home,
              NavDestination.profile,
              NavDestination.logout,
              NavDestination.assistent,
            ],
          ),
        ],
      ),
    ),
  ),
),
      body: Center(child: Text('Hello World')),
    );
  }
}
