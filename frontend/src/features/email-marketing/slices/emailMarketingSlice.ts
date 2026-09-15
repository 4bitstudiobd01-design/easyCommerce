import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EmailCampaign } from '../api/emailMarketingApi';

interface EmailMarketingState {
  selectedCampaign: EmailCampaign | null;
  isCreateModalOpen: boolean;
}

const initialState: EmailMarketingState = {
  selectedCampaign: null,
  isCreateModalOpen: false,
};

export const emailMarketingSlice = createSlice({
  name: 'emailMarketing',
  initialState,
  reducers: {
    openCreateModal: (state) => {
      state.isCreateModalOpen = true;
    },
    closeCreateModal: (state) => {
      state.isCreateModalOpen = false;
    },
    setSelectedCampaign: (state, action: PayloadAction<EmailCampaign | null>) => {
      state.selectedCampaign = action.payload;
    },
  },
});

export const { openCreateModal, closeCreateModal, setSelectedCampaign } =
  emailMarketingSlice.actions;

export default emailMarketingSlice.reducer;
