import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Chip,
    IconButton,
} from '@mui/material';
import { Add, Delete, Person } from '@mui/icons-material';
import api from '../services/api';

interface User {
    id: number;
    username: string;
    email?: string;
    role: 'ADMIN' | 'RECEPTION' | 'STAFF';
    createdAt: string;
}

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        role: 'RECEPTION' as 'ADMIN' | 'RECEPTION',
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data.data || []);
        } catch (err: any) {
            setError('Erreur lors du chargement des utilisateurs');
        }
    };

    const handleCreateUser = async () => {
        try {
            setError(null);
            await api.post('/users', formData);
            setSuccess('Utilisateur créé avec succès');
            setOpenDialog(false);
            setFormData({ username: '', password: '', email: '', role: 'RECEPTION' });
            loadUsers();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la création');
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
        
        try {
            await api.delete(`/users/${id}`);
            setSuccess('Utilisateur supprimé avec succès');
            loadUsers();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la suppression');
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'Administrateur';
            case 'RECEPTION': return 'Réception';
            case 'STAFF': return 'Personnel';
            default: return role;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'error';
            case 'RECEPTION': return 'primary';
            case 'STAFF': return 'default';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Person fontSize="large" color="primary" />
                    <Typography variant="h4" fontWeight={700}>
                        Gestion des Utilisateurs
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setOpenDialog(true)}
                >
                    Créer un compte
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

            <Card>
                <CardContent>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Nom d'utilisateur</strong></TableCell>
                                <TableCell><strong>Email</strong></TableCell>
                                <TableCell><strong>Rôle</strong></TableCell>
                                <TableCell><strong>Date de création</strong></TableCell>
                                <TableCell align="right"><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <Typography variant="body1" fontWeight={600}>
                                            {user.username}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{user.email || '-'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={getRoleLabel(user.role)}
                                            color={getRoleColor(user.role) as any}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDeleteUser(user.id)}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Dialog de création */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Créer un nouveau compte</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Nom d'utilisateur"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Mot de passe"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Email (optionnel)"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            fullWidth
                        />
                        <FormControl fullWidth required>
                            <InputLabel>Rôle</InputLabel>
                            <Select
                                value={formData.role}
                                label="Rôle"
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'RECEPTION' })}
                            >
                                <MenuItem value="RECEPTION">Réception</MenuItem>
                                <MenuItem value="ADMIN">Administrateur</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateUser}
                        disabled={!formData.username || !formData.password || !formData.role}
                    >
                        Créer
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
