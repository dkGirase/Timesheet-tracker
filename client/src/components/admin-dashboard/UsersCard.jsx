import { useNavigate } from "react-router-dom";
import { useDashboardStore } from "@/store/useDashboardStore";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  LockKeyhole,
  ShieldCheck,
  ShieldX,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RoleBadge } from "@/components/common/RoleBadge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Initials from "@/components/common/Initials";
import { getInitials } from "@/utils";
import { ROLE_LABELS, DEPARTMENT_LABELS } from "@/constants";
import { toast } from "sonner";
import ChangePinDialog from "@/components/common/ChangePinDialog";
import ChangePasswordDialog from "@/components/common/ChangePasswordDialog";
import ChangeRoleDialog from "@/components/common/ChangeRoleDialog";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Funnel, FunnelPlus } from "lucide-react";

export default function UsersCard() {
  const navigate = useNavigate();

  const { users, toggleUserActivation, updateUserRole } = useDashboardStore();

  // Local state for dialogs
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [resetPinUser, setResetPinUser] = useState(null);
  const [roleUser, setRoleUser] = useState(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetPinOpen, setResetPinOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("active");

  const copyUserDetails = (user) => {
    const text = `
Name: ${user.userInfo.firstName} ${user.userInfo.lastName}
Employee Code: ${user.employeeCode}
Email: ${user.email}
Role: ${ROLE_LABELS[user.role]}
Department: ${user.userInfo.department
        ? DEPARTMENT_LABELS[user.userInfo.department]
        : "N/A"
      }
`.trim();

    navigator.clipboard.writeText(text);
    toast.success("User details copied to clipboard");
  };

  // Filter users based on search term (case-insensitive)
  const filteredUsers = users.filter((user) => {
    // 🔍 Search (always applies)
    const fullName =
      `${user.userInfo.firstName} ${user.userInfo.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());

    // 🔽 Status filter
    const matchesFilter =
      userFilter === "all"
        ? true
        : userFilter === "active"
          ? user.isActive
          : !user.isActive;

    return matchesSearch && matchesFilter;
  });

  const getHeadingLabel = () => {
    switch (userFilter) {
      case "active":
        return "Active Users";
      case "inactive":
        return "Deactivated Users";
      default:
        return "All Users";
    }
  };

  return (
    <>
      <section className="w-full">
        <Card className="w-full">
          <CardContent>
            <div className="flex items-center justify-between mb-5 gap-4">
              {/* LEFT: Heading only */}
              <div className="min-w-[150px]">
                <h2 className="text-2xl font-semibold">
                  {getHeadingLabel()}
                </h2>
              </div>

              {/* RIGHT: Search + Filter */}
              <div className="flex items-center gap-3 w-1/2 justify-end">
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  className="flex-1"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-16 cursor-pointer flex justify-center">
                    <SelectValue asChild>
                      <div className="flex items-center justify-center">
                        {userFilter === "all" ? <Funnel size={16} /> : <FunnelPlus size={16} />}
                      </div>
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="active">Active Users</SelectItem>
                    <SelectItem value="inactive">Deactivated Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>


            <div className="grid grid-cols-2 gap-x-3 gap-y-7 min-h-48 max-h-87.5 overflow-auto">
              {filteredUsers.length === 0 ? (
                <p className="text-muted-foreground col-span-3">
                  No users found.
                </p>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center pr-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative w-12 h-12 shrink-0">
                          <Initials
                            initials={getInitials(
                              user.userInfo.firstName,
                              user.userInfo.lastName,
                            )}
                            size={12}
                            fontSizeClass="text-xl"
                            isActive={user.isActive}
                          />
                          <div className="absolute -bottom-3 -right-3 bg-white rounded-full p-1 shadow">
                            {user.isActive ? (
                              <ShieldCheck className="w-6 h-6 text-green-700" />
                            ) : (
                              <ShieldX className="w-6 h-6 text-gray-500" />
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {user.userInfo.firstName} {user.userInfo.lastName}
                      </TooltipContent>
                    </Tooltip>

                    <div className="ml-5 shrink grow truncate">
                      <Popover>
                        <PopoverTrigger asChild>
                          <p className="cursor-pointer font-semibold text-base mb-1 hover:underline truncate">
                            {user.userInfo.firstName} {user.userInfo.lastName}
                          </p>
                        </PopoverTrigger>

                        <PopoverContent className="w-72 space-y-3 text-sm">
                          <div className="flex items-center justify-between mb-5">
                            <span className="font-medium text-lg">
                              User Details
                            </span>

                            <div className="flex items-center gap-3">
                              <ExternalLink
                                className="h-4 w-4 cursor-pointer text-blue-600 hover:text-blue-700 transition"
                                onClick={() =>
                                  window.open(`/calendar/${user.id}`, "_blank")
                                }
                              />

                              {/* 📋 Copy Button */}
                              <Button
                                onClick={() => copyUserDetails(user)}
                                variant="outline"
                                size="sm"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Employee Code
                            </span>
                            <span className="font-medium">
                              {user.employeeCode}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-medium ml-5 truncate cursor-pointer">
                                  {user.email}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>{user.email}</TooltipContent>
                            </Tooltip>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Role</span>
                            <span className="font-medium">
                              {ROLE_LABELS[user.role]}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Department
                            </span>
                            <span className="font-medium">
                              {user.userInfo.department
                                ? DEPARTMENT_LABELS[user.userInfo.department]
                                : "N/A"}
                            </span>
                          </div>
                        </PopoverContent>
                      </Popover>

                      <RoleBadge
                        isActive={user.isActive}
                        className="ml-0"
                        role={user.role}
                      />
                    </div>

                    {user.role !== "ADMIN" && (
                      <div className="flex items-center gap-2 ml-auto shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                              <LockKeyhole />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => {
                                setRoleUser(user);
                                setRoleDialogOpen(true);
                              }}
                            >
                              Change Role
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => {
                                setResetPasswordUser(user);
                                setResetDialogOpen(true);
                              }}
                            >
                              Change Password
                            </DropdownMenuItem>

                            {user.role === "SUPER_ADMIN" && (
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => {
                                  setResetPinUser(user);
                                  setResetPinOpen(true);
                                }}
                              >
                                Change PIN
                              </DropdownMenuItem>
                            )}

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuItem
                                  className="cursor-pointer flex justify-between"
                                  onClick={() =>
                                    toggleUserActivation(user.id, user.isActive)
                                  }
                                >
                                  Active
                                  <Switch
                                    checked={user.isActive}
                                    onCheckedChange={() =>
                                      toggleUserActivation(
                                        user.id,
                                        user.isActive,
                                      )
                                    }
                                    className="data-[state=checked]:bg-green-700 data-[state=unchecked]:bg-red-600"
                                  />
                                </DropdownMenuItem>
                              </TooltipTrigger>
                              <TooltipContent>
                                {user.isActive
                                  ? "Click to Deactivate"
                                  : "Click to Activate"}
                              </TooltipContent>
                            </Tooltip>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Dialogs */}
      <ChangePasswordDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        user={resetPasswordUser}
      />
      <ChangePinDialog
        open={resetPinOpen}
        onOpenChange={setResetPinOpen}
        user={resetPinUser}
      />
      <ChangeRoleDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        user={roleUser}
        onRoleChanged={(newRole) => {
          updateUserRole(roleUser.id, newRole);
        }}
      />
    </>
  );
}
