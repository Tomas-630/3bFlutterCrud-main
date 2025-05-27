import 'dart:convert';
import 'package:http/http.dart' as http;
import 'user_model.dart';

class ApiService {
  static const String baseUrl = "http://localhost:5000/users";

  // fetch users

  static Future<List<User>> getUsers() async {
    final response = await http.get(Uri.parse(baseUrl));
    if (response.statusCode == 200) {
      List jsonResponse = json.decode(response.body);
      return jsonResponse.map((data) => User.fromJson(data)).toList();
    } else {
      throw Exception("Failed to load users");
    }
  }

  // add users

  static Future<void> addUser(String name, String email) async {
    await http.post(
      Uri.parse(baseUrl),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"name": name, "email": email}),
    );
  }

  // Update users

  static Future<void> updateUser(int id, String name, String email) async {
    await http.put(
      Uri.parse("$baseUrl/$id"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"name": name, "email": email}),
    );
  }
  // Delete user

  static Future<void> deleteUser(int id) async {
    await http.delete(Uri.parse("$baseUrl/$id"));
  }
}
