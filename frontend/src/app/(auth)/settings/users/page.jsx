"use client";

import { useEffect, useState } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { Form, FormGroup, Label, Input, Button, Modal, ModalBody, ModalFooter, ModalHeader, Table } from "reactstrap";
import { useToast } from "@/components/ui/use-toast";
import { EditIcon, Filter, TrashIcon } from "lucide-react";
import MessageModal from "@/components/ui/MessageModal";
import styles from "@/components/ui/listing.module.css";
import Spinner from "@/components/ui/Spinner";
import useIsMobile from "@/hooks/useIsMobile";
import MobileFiltersModal from "@/components/ui/MobileFiltersModal";

const emptyUser = { name: "", surname: "", email: "", idRole: "", password: "", active: true };

export default function UserList() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
    const [error, setError] = useState(null);
    const [creatingUser, setCreatingUser] = useState(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [deleteConfirmModal, setDeleteConfirmModal] = useState({ show: false, user: null });
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filters, setFilters] = useState({ name: "", email: "", role: "all", active: "all" });
    const isMobile = useIsMobile();
    const { toast } = useToast();

    async function fetchUsers() {
        try {
            setLoading(true);
            setError(null);
            const res = await ApiComunicator("/users", "GET");
            setUsers(res.users);
            setRoles(res.roles);
            setCurrentUserId(res.idUser);
        } catch (err) {
            setError(err.message);
            setUsers([]);
        } finally {
            setLoading(false);
            setHasFetchedOnce(true);
        }
    }

    useEffect(() => {
        fetchUsers();
    }, []);

    function payload(userState) {
        return {
            name: userState.name,
            surname: userState.surname,
            email: userState.email,
            idRole: userState.idRole,
            password: userState.password,
            active: !!userState.active
        };
    }

    const createUser = async () => {
        try {
            setLoading(true);
            await ApiComunicator("/users/new", "POST", payload(creatingUser));
            await fetchUsers();
            setEditorOpen(false);
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: err.message || "Error creating user" });
        } finally {
            setLoading(false);
        }
    };

    const editUser = async (id) => {
        try {
            setLoading(true);
            await ApiComunicator("/users/edit", "POST", { idUser: id, ...payload(selectedUser) });
            await fetchUsers();
            setEditorOpen(false);
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: err.message || "An error occurred while editing the user." });
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        const { user } = deleteConfirmModal;
        if (!user) return;
        try {
            setLoading(true);
            const response = await ApiComunicator("/users/delete", "POST", { idUser: user.idUser });
            if (response.success) {
                setDeleteConfirmModal({ show: false, user: null });
                toast({ title: "Success", description: "User deactivated." });
                await fetchUsers();
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: err.message || "An error occurred while deactivating the user." });
        } finally {
            setLoading(false);
        }
    };

    function toggleEditUser(user) {
        setCreatingUser(null);
        setSelectedUser({ ...user, password: "", active: !!user.active });
        setEditorOpen(true);
    }

    const renderEditFields = (userState, setUserState, idSuffix) => (
        <div className={styles.editFields}>
            <FormGroup className="mb-0">
                <Label for={`name-${idSuffix}`}>First name</Label>
                <Input id={`name-${idSuffix}`} value={userState.name || ""} onChange={(e) => setUserState({ ...userState, name: e.target.value })} />
            </FormGroup>
            <FormGroup className="mb-0">
                <Label for={`surname-${idSuffix}`}>Last name</Label>
                <Input id={`surname-${idSuffix}`} value={userState.surname || ""} onChange={(e) => setUserState({ ...userState, surname: e.target.value })} />
            </FormGroup>
            <FormGroup className="mb-0">
                <Label for={`email-${idSuffix}`}>Email</Label>
                <Input id={`email-${idSuffix}`} type="email" value={userState.email || ""} onChange={(e) => setUserState({ ...userState, email: e.target.value })} />
            </FormGroup>
            <FormGroup className="mb-0">
                <Label for={`role-${idSuffix}`}>Role</Label>
                <Input id={`role-${idSuffix}`} type="select" value={userState.idRole || ""} onChange={(e) => setUserState({ ...userState, idRole: e.target.value })}>
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                        <option key={role.idRole} value={role.idRole}>{role.role}</option>
                    ))}
                </Input>
            </FormGroup>
            <FormGroup className="mb-0">
                <Label for={`password-${idSuffix}`}>{creatingUser ? "Password" : "Password (leave blank to keep)"}</Label>
                <Input id={`password-${idSuffix}`} type="password" value={userState.password || ""} onChange={(e) => setUserState({ ...userState, password: e.target.value })} />
            </FormGroup>
            <FormGroup switch className="mb-0">
                <Input type="switch" id={`active-${idSuffix}`} checked={!!userState.active} style={{ cursor: "pointer" }} onChange={(e) => setUserState({ ...userState, active: e.target.checked })} />
                <Label for={`active-${idSuffix}`} check>Active</Label>
            </FormGroup>
        </div>
    );

    if (!hasFetchedOnce && loading) return <Spinner />;

    const visibleUsers = users.filter((row) => {
        const fullName = `${row.name || ""} ${row.surname || ""}`.toLowerCase();
        if (filters.name && !fullName.includes(filters.name.toLowerCase())) return false;
        if (filters.email && !String(row.email || "").toLowerCase().includes(filters.email.toLowerCase())) return false;
        if (filters.role !== "all" && String(row.idRole) !== filters.role) return false;
        if (filters.active === "yes" && !row.active) return false;
        if (filters.active === "no" && row.active) return false;
        return true;
    });
    const updateFilter = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }));
    const resetFilters = () => setFilters({ name: "", email: "", role: "all", active: "all" });
    const activeFilterCount = [filters.name, filters.email].filter(Boolean).length + (filters.role !== "all" ? 1 : 0) + (filters.active !== "all" ? 1 : 0);
    const fieldMin = isMobile ? "100%" : undefined;
    const canSave = (userState, needsPassword) => userState && userState.name && userState.surname && userState.email && userState.idRole && (!needsPassword || (userState.password && userState.password.length >= 8));

    const filterFields = (idPrefix = "") => (
        <>
            <FormGroup style={{ minWidth: fieldMin || "180px" }}>
                <Label for={`${idPrefix}filterName`}>Name</Label>
                <Input id={`${idPrefix}filterName`} value={filters.name} onChange={(e) => updateFilter("name", e.target.value)} />
            </FormGroup>
            <FormGroup style={{ minWidth: fieldMin || "180px" }}>
                <Label for={`${idPrefix}filterEmail`}>Email</Label>
                <Input id={`${idPrefix}filterEmail`} value={filters.email} onChange={(e) => updateFilter("email", e.target.value)} />
            </FormGroup>
            <FormGroup style={{ minWidth: fieldMin || "160px" }}>
                <Label for={`${idPrefix}filterRole`}>Role</Label>
                <Input id={`${idPrefix}filterRole`} type="select" value={filters.role} onChange={(e) => updateFilter("role", e.target.value)}>
                    <option value="all">All</option>
                    {roles.map((role) => (
                        <option key={role.idRole} value={role.idRole}>{role.role}</option>
                    ))}
                </Input>
            </FormGroup>
            <FormGroup style={{ minWidth: fieldMin || "140px" }}>
                <Label for={`${idPrefix}filterActive`}>Active</Label>
                <Input id={`${idPrefix}filterActive`} type="select" value={filters.active} onChange={(e) => updateFilter("active", e.target.value)}>
                    <option value="all">All</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                </Input>
            </FormGroup>
        </>
    );

    const rowActions = (row) => (
        <div className="d-flex gap-2">
            <Button color="primary" size="sm" outline onClick={() => toggleEditUser(row)}>
                <EditIcon size={16} /> Edit
            </Button>
            {!!row.active && Number(row.idUser) !== Number(currentUserId) && (
                <Button color="danger" size="sm" outline onClick={() => setDeleteConfirmModal({ show: true, user: row })}>
                    <TrashIcon size={16} /> Deactivate
                </Button>
            )}
        </div>
    );

    return (
        <div className={styles.page}>
            <div className={styles.pageActions}>
                <Button color="primary" size="sm" onClick={() => {
                    setSelectedUser(null);
                    setCreatingUser({ ...emptyUser, idRole: roles[0] ? roles[0].idRole : "" });
                    setEditorOpen(true);
                }}>
                    + New user
                </Button>
            </div>

            {error && <p className="text-sm text-red-600 px-3">{error}</p>}

            <div className={styles.mobileToolbar}>
                <Button color="primary" outline className={styles.filtersBtn} type="button" onClick={() => setFiltersOpen(true)}>
                    <Filter size={16} />
                    Filters
                    {activeFilterCount > 0 && <span className={styles.filtersBadge}>{activeFilterCount}</span>}
                </Button>
            </div>
            <Form className={`${styles.filtersCard} ${styles.desktopOnly}`}>
                <div className="d-flex flex-wrap gap-3 align-items-end">
                    {filterFields()}
                </div>
            </Form>
            <MobileFiltersModal isOpen={filtersOpen} toggle={() => setFiltersOpen(false)} onApply={() => setFiltersOpen(false)} onReset={resetFilters}>
                {filterFields("mobile-")}
            </MobileFiltersModal>

            <div className={`${styles.tableCard} ${styles.desktopOnly}`}>
                <Table>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Active</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleUsers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center text-muted">No users found.</td>
                            </tr>
                        )}
                        {visibleUsers.map((row) => (
                            <tr key={row.idUser}>
                                <td className="fw-semibold">{`${row.name || ""} ${row.surname || ""}`.trim() || row.email}</td>
                                <td>{row.email}</td>
                                <td>{row.role || "-"}</td>
                                <td><span className={`${styles.badge} ${row.active ? styles.badgeOk : styles.badgeNo}`}>{row.active ? "Active" : "Inactive"}</span></td>
                                <td>{rowActions(row)}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            <div className={`${styles.cardsList} ${styles.mobileOnly}`}>
                {visibleUsers.length === 0 && (
                    <div className={styles.emptyCard}>
                        <p className="mb-0 text-sm text-gray-500">No users found.</p>
                    </div>
                )}
                {visibleUsers.map((row) => (
                    <div key={row.idUser} className={styles.card}>
                        <div className={styles.cardHead}>
                            <h3 className={styles.cardTitle}>{`${row.name || ""} ${row.surname || ""}`.trim() || row.email}</h3>
                            <span className={`${styles.badge} ${row.active ? styles.badgeOk : styles.badgeNo}`}>{row.active ? "Active" : "Inactive"}</span>
                        </div>
                        <div className={styles.cardMeta}>
                            <div>
                                <span className={styles.cardMetaLabel}>Email</span>
                                {row.email || "-"}
                            </div>
                            <div>
                                <span className={styles.cardMetaLabel}>Role</span>
                                {row.role || "-"}
                            </div>
                        </div>
                        <div className={styles.cardActions}>{rowActions(row)}</div>
                    </div>
                ))}
            </div>

            {loading && hasFetchedOnce && <div className="px-3 text-sm text-gray-500">Loading users...</div>}

            <Modal isOpen={editorOpen} centered toggle={() => setEditorOpen(false)} onClosed={() => { if (!editorOpen) { setCreatingUser(null); setSelectedUser(null); } }}>
                <ModalHeader toggle={() => setEditorOpen(false)} style={{ backgroundColor: "#1e1e1e", color: "white" }}>
                    <span style={{ color: "white" }}>{creatingUser ? "New user" : "Edit user"}</span>
                </ModalHeader>
                <ModalBody>
                    {creatingUser && renderEditFields(creatingUser, setCreatingUser, "new")}
                    {selectedUser && renderEditFields(selectedUser, setSelectedUser, selectedUser.idUser)}
                </ModalBody>
                <ModalFooter style={{ backgroundColor: "#f8f9fa" }}>
                    <Button style={{ fontSize: "13px", fontWeight: "600" }} color="secondary" outline onClick={() => setEditorOpen(false)} disabled={loading}>Cancel</Button>
                    <Button
                        style={{ fontSize: "13px", fontWeight: "600" }}
                        color="success"
                        disabled={loading || (creatingUser ? !canSave(creatingUser, true) : !canSave(selectedUser, false))}
                        onClick={() => { if (creatingUser) createUser(); else editUser(selectedUser.idUser); }}
                    >
                        {loading ? "Saving..." : "Save"}
                    </Button>
                </ModalFooter>
            </Modal>

            <MessageModal
                isOpen={deleteConfirmModal.show}
                type="confirm"
                title="Deactivate user"
                confirmLabel={loading ? "Deactivating..." : "Deactivate"}
                confirmColor="danger"
                disabled={loading}
                onClose={() => setDeleteConfirmModal({ show: false, user: null })}
                onConfirm={confirmDelete}
            >
                Are you sure you want to deactivate {deleteConfirmModal.user && `${deleteConfirmModal.user.name || ""} ${deleteConfirmModal.user.surname || ""}`.trim()}?
            </MessageModal>
        </div>
    );
}
