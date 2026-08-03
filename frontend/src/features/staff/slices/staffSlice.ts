import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StaffMember, StaffPermissionType } from '../api/staffApi';

interface StaffState {
  selectedStaff: StaffMember | null;
  isInviteModalOpen: boolean;
  isEditModalOpen: boolean;
  userPermissions: StaffPermissionType[];
  isOwner: boolean;
}

const initialState: StaffState = {
  selectedStaff: null,
  isInviteModalOpen: false,
  isEditModalOpen: false,
  userPermissions: [],
  isOwner: false,
};

export const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    openInviteModal: (state) => {
      state.isInviteModalOpen = true;
    },
    closeInviteModal: (state) => {
      state.isInviteModalOpen = false;
    },
    openEditModal: (state, action: PayloadAction<StaffMember>) => {
      state.selectedStaff = action.payload;
      state.isEditModalOpen = true;
    },
    closeEditModal: (state) => {
      state.selectedStaff = null;
      state.isEditModalOpen = false;
    },
    setUserPermissions: (
      state,
      action: PayloadAction<{ permissions: StaffPermissionType[]; isOwner: boolean }>,
    ) => {
      state.userPermissions = action.payload.permissions;
      state.isOwner = action.payload.isOwner;
    },
  },
});

export const {
  openInviteModal,
  closeInviteModal,
  openEditModal,
  closeEditModal,
  setUserPermissions,
} = staffSlice.actions;

export default staffSlice.reducer;
