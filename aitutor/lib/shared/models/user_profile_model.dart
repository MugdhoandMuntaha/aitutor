class UserProfileModel {
  final String id;
  final String fullName;
  final String email;
  final String university;
  final String major;
  final String academicYear;
  final String? avatarPath;
  final String avatarPreset; // 'student_male', 'student_female', 'scholar', 'graduate', 'code', 'book'
  final int streakDays;
  final int dailyGoalMinutes;
  final int todayStudyMinutes;

  UserProfileModel({
    required this.id,
    required this.fullName,
    required this.email,
    required this.university,
    required this.major,
    required this.academicYear,
    this.avatarPath,
    this.avatarPreset = 'student_male',
    this.streakDays = 12,
    this.dailyGoalMinutes = 60,
    this.todayStudyMinutes = 45,
  });

  UserProfileModel copyWith({
    String? fullName,
    String? email,
    String? university,
    String? major,
    String? academicYear,
    String? avatarPath,
    String? avatarPreset,
    int? streakDays,
    int? dailyGoalMinutes,
    int? todayStudyMinutes,
  }) {
    return UserProfileModel(
      id: id,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      university: university ?? this.university,
      major: major ?? this.major,
      academicYear: academicYear ?? this.academicYear,
      avatarPath: avatarPath ?? this.avatarPath,
      avatarPreset: avatarPreset ?? this.avatarPreset,
      streakDays: streakDays ?? this.streakDays,
      dailyGoalMinutes: dailyGoalMinutes ?? this.dailyGoalMinutes,
      todayStudyMinutes: todayStudyMinutes ?? this.todayStudyMinutes,
    );
  }
}
