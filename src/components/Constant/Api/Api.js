// ============================================================================
// BASE URL
// ============================================================================
export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001/api";

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================
export const AuthService = BASE_URL + "/auth/";
export const LoginAPI = AuthService + "login";
export const MeAPI = AuthService + "me";
export const LogoutAPI = AuthService + "logout";
export const AuthRefreshAPI = AuthService + "refresh";
export const ForgotPasswordAPI = AuthService + "forgot-password";
export const ResetPasswordAPI = AuthService + "reset-password";
export const CheckResetTokenAPI = (token) => `${AuthService}reset-password/${token}`;

// ============================================================================
// USER ENDPOINTS
// ============================================================================
export const UserService = BASE_URL + "/users/";
export const GetAllUsersAPI = UserService + "get-user";
export const GetUserByIdAPI = (id) => UserService + id;
export const CreateUserAPI = UserService + "create-user";
export const UpdateUserAPI = (id) => UserService + id + "/update-user";
export const DeleteUserAPI = (id) => UserService + id + "/delete-user";
export const ResetUserPasswordAPI = (id) => UserService + id + "/reset-password";
export const ToggleUserStatusAPI = (id) => UserService + id + "/toggle-status";
export const ChangeUserPasswordAPI = UserService + "change-password";

/* ================= DEPARTMENT ================= */
export const DepartmentService = BASE_URL + "/departments";

export const GetAllDepartmentsAPI = DepartmentService + "/get-all";
export const CreateDepartmentAPI = DepartmentService + "/create-department";
export const UpdateDepartmentAPI = (id) => `${DepartmentService}/${id}/update-department`;
export const DeleteDepartmentAPI = (id) => `${DepartmentService}/${id}/delete-department`;
export const ToggleDepartmentStatusAPI = (id) => `${DepartmentService}/${id}/toggle-status`;


/* ================= JOB ROLE ================= */
export const JobRoleService = BASE_URL + "/job-roles";

export const GetAllJobRolesAPI = JobRoleService + "/get-all";
export const GetJobRolesByDepartmentAPI = (id) => JobRoleService + "/by-department/" + id;
export const CreateJobRoleAPI = JobRoleService + "/create-job-role";
export const UpdateJobRoleAPI = (id) => `${JobRoleService}/${id}/update-job-role`;
export const DeleteJobRoleAPI = (id) => `${JobRoleService}/${id}/delete-job-role`;
export const ToggleJobRoleStatusAPI = (id) => `${JobRoleService}/${id}/toggle-status`;


// ============================================================================
// DASHBOARD ENDPOINTS
// ============================================================================
export const DashboardService = BASE_URL + "/dashboard";
export const SuperAdminDashboardAPI = DashboardService + "/superadmin";
export const AdminDashboardAPI = DashboardService + "/admin";
export const HrDashboardAPI = DashboardService + "/hr";
export const ManagerDashboardAPI = DashboardService + "/manager";
export const EmployeeDashboardAPI = DashboardService + "/employee";

// ============================================================================
// SYSTEM LOGS ENDPOINTS
// ============================================================================
export const SystemLogService = BASE_URL + "/system-logs/";
export const GetAllSystemLogsAPI = SystemLogService + "get-logs";
export const CleanupSystemLogsAPI = SystemLogService + "cleanup";

// ============================================================================
// ROLE ENDPOINTS
// ============================================================================
export const RoleService = BASE_URL + "/roles";
export const GetAllRolesAPI = RoleService + "/get-roles";
export const GetRoleByIdAPI = (id) => `${RoleService}/${id}`;
export const CreateRoleAPI = RoleService + "/create-role";
export const UpdateRoleAPI = (id) => `${RoleService}/${id}/update-role`;
export const DeleteRoleAPI = (id) => `${RoleService}/${id}/delete-role`;

// Optional: Bonus APIs (agar controller mein add kiye ho)
export const GetRolesByTypeAPI = (roleType) => `${RoleService}/type/${roleType}`;
export const CheckPermissionAPI = RoleService + "/check-permission";

// ============================================================================
// EMPLOYEE ENDPOINTS
// ============================================================================
export const EmployeeService = BASE_URL + "/employees/";
export const GetAllEmployeesAPI = EmployeeService + "get-employees";
export const GetEmployeeByIdAPI = (id) => EmployeeService + id;
export const CreateEmployeeAPI = EmployeeService;
export const UpdateEmployeeAPI = (id) => EmployeeService + id;
export const DeleteEmployeeAPI = (id) => EmployeeService + id;

// ============================================================================
// LEAVE MANAGEMENT ENDPOINTS
// ============================================================================
export const LeaveService = BASE_URL + "/leaves/";
export const GetAllLeavesAPI = LeaveService + "get-leaves";
export const GetMyLeavesAPI = LeaveService + "get-my-leaves";
export const ApplyLeaveAPI = LeaveService + "apply-leave";
export const ApproveLeaveAPI = (id) => LeaveService + id + "/approve-leave";
export const RejectLeaveAPI = (id) => LeaveService + id + "/reject-leave";

// ============================================================================
// ATTENDANCE ENDPOINTS
// ============================================================================
export const AttendanceService = BASE_URL + "/attendance/";
export const GetAttendanceOverviewAPI = AttendanceService + "get-attendance";
export const GetAttendanceReportsAPI = AttendanceService + "reports";
export const GetMyAttendanceAPI = AttendanceService + "get-my-attendance";
export const MarkAttendanceAPI = AttendanceService + "mark-attendance";
export const AttendanceTodayStatusAPI = AttendanceService + "today-status";
export const WfhHeartbeatAPI = AttendanceService + "wfh-heartbeat";

// ============================================================================
// RECRUITMENT ENDPOINTS
// ============================================================================
export const RecruitmentService = BASE_URL + "/recruitment/";
export const GetAllJobPostingsAPI = RecruitmentService;
export const CreateJobPostingAPI = RecruitmentService;
export const UpdateJobStatusAPI = (id) => RecruitmentService + id + "/status";

// ============================================================================
// SYSTEM SETTINGS ENDPOINTS
// ============================================================================
export const SystemSettingsService = BASE_URL + "/system-settings/";
export const GetSystemSettingsAPI = SystemSettingsService + "get-system-setting";
export const UpdateSystemSettingsAPI = SystemSettingsService + "update-system-setting";

// ============================================================================
// TASK MANAGEMENT ENDPOINTS (Manager & Employee)
// ============================================================================
export const TaskService = BASE_URL + "/tasks/";
export const GetAllTasksAPI = TaskService + "get-task";
export const GetMyTasksAPI = TaskService + "my-tasks";
export const CreateTaskAPI = TaskService + "create-task";
export const UpdateTaskAPI = (id) => TaskService + id + "/update-task";
export const UpdateTaskStatusAPI = (id) => TaskService + `${id}/update-status`;
export const DeleteTaskAPI = (id) => TaskService + id + "/delete-task";

// ============================================================================
// TEAM MANAGEMENT ENDPOINTS (Manager)
// ============================================================================
export const TeamService = BASE_URL + "/team";
export const GetMyTeamAPI = TeamService + "/my-team";
export const AddTeamMemberAPI = TeamService + "/add-member";
export const RemoveTeamMemberAPI = (id) => `${TeamService}/${id}/remove-member`;
export const TeamTreeAPI = TeamService + "/tree";
// HR / Superadmin hierarchy management
export const HierarchyOverviewAPI    = TeamService + "/hr/overview";
export const AssignManagerToAdminAPI = TeamService + "/hr/assign-manager";
export const AssignEmployeeToManagerAPI = TeamService + "/hr/assign-employee";

// ============================================================================
// ANNOUNCEMENT ENDPOINTS
// ============================================================================
export const AnnouncementService = BASE_URL + "/announcements";
export const GetAnnouncementsAPI = AnnouncementService;
export const CreateAnnouncementAPI = AnnouncementService;
export const UpdateAnnouncementAPI = (id) => `${AnnouncementService}/${id}`;
export const DeleteAnnouncementAPI = (id) => `${AnnouncementService}/${id}`;
export const LikeAnnouncementAPI = (id) => `${AnnouncementService}/${id}/like`;
export const ReactAnnouncementAPI = (id) => `${AnnouncementService}/${id}/react`;
export const AddCommentAPI = (id) => `${AnnouncementService}/${id}/comments`;
export const DeleteCommentAPI = (id, commentId) => `${AnnouncementService}/${id}/comments/${commentId}`;
export const EditCommentAPI = (id, commentId) => `${AnnouncementService}/${id}/comments/${commentId}`;
export const LikeCommentAPI = (id, commentId) => `${AnnouncementService}/${id}/comments/${commentId}/like`;
export const ReactCommentAPI = (id, commentId) => `${AnnouncementService}/${id}/comments/${commentId}/react`;

// ============================================================================
// NOTIFICATION ENDPOINTS
// ============================================================================
export const NotificationService = BASE_URL + "/notifications";
export const GetNotificationsAPI = NotificationService;
export const UnreadCountAPI = NotificationService + "/unread-count";
export const MarkReadAPI = NotificationService + "/mark-read";
export const MarkAllReadAPI = NotificationService + "/mark-all-read";

// ============================================================================
// HOLIDAY ENDPOINTS
// ============================================================================
export const PerformanceTeamAPI = BASE_URL + "/performance/team";

export const HolidayService = BASE_URL + "/holidays";
export const GetHolidaysAPI = HolidayService;
export const CreateHolidayAPI = HolidayService;
export const UpdateHolidayAPI = (id) => `${HolidayService}/${id}`;
export const DeleteHolidayAPI = (id) => `${HolidayService}/${id}`;


// ============================================================================
// APPROVAL ENDPOINTS (Manager)
// ============================================================================
export const ApprovalService = BASE_URL + "/approvals/";
export const GetAllApprovalsAPI = ApprovalService + "get-approvals";
export const CreateApprovalRequestAPI = ApprovalService + "request";
export const ApproveRequestAPI = (id) => ApprovalService + id + "/approve";
export const RejectRequestAPI = (id) => ApprovalService + id + "/reject";

// ============================================================================
// TIME OFF ENDPOINTS (Employee)
// ============================================================================
export const TimeOffService = BASE_URL + "/time-off/";
export const GetMyTimeOffAPI = TimeOffService + "my-timeoff";
export const ApplyTimeOffAPI = TimeOffService + "apply";
export const GetTimeOffBalanceAPI = TimeOffService + "balance";

// ============================================================================
// SHIFT MANAGEMENT
// ============================================================================
export const ShiftService        = BASE_URL + "/shift";
export const ListShiftsAPI       = ShiftService + "/shifts";
export const CreateShiftAPI      = ShiftService + "/shifts";
export const UpdateShiftAPI      = (id) => `${ShiftService}/shifts/${id}`;
export const DeleteShiftAPI      = (id) => `${ShiftService}/shifts/${id}`;
export const ListAssignmentsAPI  = ShiftService + "/assignments";
export const CreateAssignmentAPI = ShiftService + "/assignments";
export const DeleteAssignmentAPI = (id) => `${ShiftService}/assignments/${id}`;
export const AssignableUsersAPI  = ShiftService + "/assignable-users";

// ============================================================================
// PROFILE ENDPOINTS (All Users)
// ============================================================================
export const ProfileService = BASE_URL + "/profile/";
export const GetMyProfileAPI = ProfileService + "get-my-profile";
export const UpdateMyProfileAPI = ProfileService + "update-my-profile";
export const ChangeMyPasswordAPI = ProfileService + "change-password";
export const UploadMyDocumentAPI = ProfileService + "upload-document";
export const DeleteMyDocumentAPI = (id) => ProfileService + "document/" + id;

// ============================================================================
// PAYROLL ENDPOINTS
// ============================================================================
export const PayrollService = BASE_URL + "/payroll";
export const GetAllPayrollAPI          = PayrollService;
export const CreatePayrollAPI          = PayrollService;
export const GetMyPayslipsAPI          = PayrollService + "/my";
export const GetPayrollByIdAPI         = (id) => `${PayrollService}/${id}`;
export const UpdatePayrollAPI          = (id) => `${PayrollService}/${id}`;
export const MarkPayrollPaidAPI        = (id) => `${PayrollService}/${id}/pay`;
export const DeletePayrollAPI          = (id) => `${PayrollService}/${id}`;
export const PayrollEligibleEmployeesAPI = PayrollService + "/eligible-employees";

// ============================================================================
// DOCUMENTS ENDPOINTS
// ============================================================================
export const DocumentService = BASE_URL + "/documents";
export const DocumentFileAPI = (id) => `${BASE_URL}/documents/${id}/file`;
export const GetOrgDocumentsAPI      = DocumentService + "/org";
export const GetMyDocumentsAPI       = DocumentService + "/my";
export const GetAllPersonalDocsAPI   = DocumentService + "/all-personal";
export const GetUserDocumentsAPI     = (userId) => `${DocumentService}/user/${userId}`;
export const UploadDocumentAPI       = DocumentService;
export const UpdateDocumentAPI       = (id) => `${DocumentService}/${id}`;
export const DeleteDocumentAPI       = (id) => `${DocumentService}/${id}`;
// Static file base for downloading
export const FileBaseURL = (BASE_URL.replace(/\/api\/?$/, "")) || "";

// ============================================================================
// HEALTH CHECK
// ============================================================================
export const HealthCheckAPI = BASE_URL + "/health";

// ============================================================================
// HR ASSISTANT
// ============================================================================
export const AssistantService = BASE_URL + "/assistant/";
export const AssistantAskAPI = AssistantService + "ask";
export const AssistantSuggestionsAPI = AssistantService + "suggestions";

// ============================================================================
// ONBOARDING
// ============================================================================
export const OnboardingService = BASE_URL + "/onboarding";
export const OnboardingListAPI = OnboardingService;
export const OnboardingMyStepsAPI = OnboardingService + "/my-steps";
export const OnboardingTemplateAPI = OnboardingService + "/template";
export const OnboardingTemplateStepAPI = (id) => `${OnboardingService}/template/${id}`;
export const OnboardingStepUpdateAPI = (onboardingId, stepId) => `${OnboardingService}/${onboardingId}/steps/${stepId}`;
export const OnboardingStartAPI = (employeeId) => `${OnboardingService}/${employeeId}/start`;
export const OnboardingCancelAPI = (id) => `${OnboardingService}/${id}/cancel`;

// ============================================================================
// ASSETS
// ============================================================================
export const AssetService = BASE_URL + "/assets";
export const AssetListAPI = AssetService;
export const AssetMyAPI = AssetService + "/my";
export const AssetMetaAPI = AssetService + "/meta";
export const AssetSummaryAPI = AssetService + "/summary";
export const AssetCreateAPI = AssetService;
export const AssetByIdAPI = (id) => `${AssetService}/${id}`;
export const AssetAssignAPI = (id) => `${AssetService}/${id}/assign`;
export const AssetReturnAPI = (id) => `${AssetService}/${id}/return`;
export const AssetTransferAPI = (id) => `${AssetService}/${id}/transfer`;
export const AssetStatusAPI = (id) => `${AssetService}/${id}/status`;
export const AssetHistoryAPI = (id) => `${AssetService}/${id}/history`;

// ============================================================================
// EXPENSES / REIMBURSEMENT
// ============================================================================
export const ExpenseService = BASE_URL + "/expenses";
export const ExpenseListAPI = ExpenseService;                       // the board (scoped)
export const ExpenseMyAPI = ExpenseService + "/my";                 // own claims
export const ExpenseCreateAPI = ExpenseService;
export const ExpenseMetaAPI = ExpenseService + "/meta";             // categories + payment modes
export const ExpenseSummaryAPI = ExpenseService + "/summary";
export const ExpenseByIdAPI = (id) => `${ExpenseService}/${id}`;
export const ExpenseReceiptAPI = (id) => `${ExpenseService}/${id}/receipt`;
export const ExpenseApproveAPI = (id) => `${ExpenseService}/${id}/approve`;
export const ExpenseRejectAPI = (id) => `${ExpenseService}/${id}/reject`;
export const ExpensePayAPI = (id) => `${ExpenseService}/${id}/pay`;
export const ExpenseCancelAPI = (id) => `${ExpenseService}/${id}/cancel`;

// ============================================================================
// OFFBOARDING
// ============================================================================
export const OffboardingService = BASE_URL + "/offboarding";
export const OffboardingListAPI = OffboardingService;
export const OffboardingInitiateAPI = OffboardingService;
export const OffboardingMyStepsAPI = OffboardingService + "/my-steps";
export const OffboardingTemplateAPI = OffboardingService + "/template";
export const OffboardingTemplateStepAPI = (id) => `${OffboardingService}/template/${id}`;
export const OffboardingStepUpdateAPI = (id, stepId) => `${OffboardingService}/${id}/steps/${stepId}`;
export const OffboardingAssetsAPI = (id) => `${OffboardingService}/${id}/assets`;
export const OffboardingAssetAPI = (id, assetId) => `${OffboardingService}/${id}/assets/${assetId}`;
export const OffboardingLetterAPI = (id) => `${OffboardingService}/${id}/experience-letter`;
export const OffboardingCancelAPI = (id) => `${OffboardingService}/${id}/cancel`;
