import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/home_screen.dart';
import 'user_model.dart';
import 'api_service.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Login Demo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(),
        ),
      ),
      initialRoute: '/login',
      routes: {
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/home': (context) => const HomeScreen(),
      },
    );
  }
}

class UserScreen extends StatefulWidget {
  @override
  _UserScreenState createState() => _UserScreenState();
}

class _UserScreenState extends State<UserScreen> {
  late Future<List<User>> futureUsers;
  final TextEditingController nameController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  int? editingId;

  @override
  void initState() {
    super.initState();
    futureUsers = ApiService.getUsers();
  }

  void refreshUsers() {
    setState(() {
      futureUsers = ApiService.getUsers();
    });
  }

  void handleSave() async {
    String name = nameController.text;
    String email = emailController.text;

    if (editingId == null) {
      await ApiService.addUser(name, email);
    } else {
      await ApiService.updateUser(editingId!, name, email);
    }

    nameController.clear();
    emailController.clear();
    editingId = null;
    refreshUsers();
  }

  void handleEdit(User user) {
    setState(() {
      nameController.text = user.name;
      emailController.text = user.email;
      editingId = user.id;
    });
  }

  void handleDelete(int id) async {
    await ApiService.deleteUser(id);
    refreshUsers();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Flutter Crud with Express and MySQL")),
      body: Column(
        children: [
          Padding(
            padding: EdgeInsets.all(8.0),
            child: Column(
              children: [
                TextField(
                  controller: nameController,
                  decoration: InputDecoration(labelText: "Name"),
                ),
                TextField(
                  controller: emailController,
                  decoration: InputDecoration(labelText: "Email"),
                ),
                SizedBox(height: 10),
                ElevatedButton(
                  onPressed: handleSave,
                  child: Text(editingId == null ? "Add User" : "Update User"),
                ),
              ],
            ),
          ),
          Expanded(
            child: FutureBuilder<List<User>>(
              future: futureUsers,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting)
                  return Center(child: CircularProgressIndicator());
                if (!snapshot.hasData || snapshot.data!.isEmpty)
                  return Center(child: Text("No Users Found"));
                return ListView(
                  children: snapshot.data!.map((user) {
                    return ListTile(
                      title: Text(user.name),
                      subtitle: Text(user.email),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: Icon(Icons.edit),
                            onPressed: () => handleEdit(user),
                          ),
                          IconButton(
                            icon: Icon(Icons.delete),
                            onPressed: () => handleDelete(user.id),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
