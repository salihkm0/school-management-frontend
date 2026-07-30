import React from 'react';
import { Box, Typography, Container, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const TermsAndConditions = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Button 
        onClick={() => navigate('/')}
        sx={{ mb: 4 }}
      >
        &larr; Back to Home
      </Button>
      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 2 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Terms and Conditions
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>

        <Typography variant="body1" paragraph sx={{ mt: 4 }}>
          Please read these terms and conditions carefully before using Our Service. By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 'bold' }}>
          1. Definitions
        </Typography>
        <Typography variant="body1" paragraph>
          For the purposes of these Terms and Conditions:
        </Typography>
        <ul>
          <li><Typography variant="body1"><strong>Account</strong> means a unique account created for You to access our Service or parts of our Service.</Typography></li>
          <li><Typography variant="body1"><strong>Service</strong> refers to the Website and our school management platform.</Typography></li>
          <li><Typography variant="body1"><strong>You</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</Typography></li>
        </ul>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 'bold' }}>
          2. User Accounts
        </Typography>
        <Typography variant="body1" paragraph>
          When You create an account with Us, You must provide Us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of Your account on Our Service.
        </Typography>
        <Typography variant="body1" paragraph>
          You are responsible for safeguarding the password that You use to access the Service and for any activities or actions under Your password, whether Your password is with Our Service or a Third-Party Social Media Service.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 'bold' }}>
          3. Termination
        </Typography>
        <Typography variant="body1" paragraph>
          We may terminate or suspend Your Account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if You breach these Terms and Conditions. Upon termination, Your right to use the Service will cease immediately.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 'bold' }}>
          4. Limitation of Liability
        </Typography>
        <Typography variant="body1" paragraph>
          Notwithstanding any damages that You might incur, the entire liability of the Company and any of its suppliers under any provision of this Terms and Your exclusive remedy for all of the foregoing shall be limited to the amount actually paid by You through the Service.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 'bold' }}>
          5. Changes to These Terms and Conditions
        </Typography>
        <Typography variant="body1" paragraph>
          We reserve the right, at Our sole discretion, to modify or replace these Terms at any time. If a revision is material We will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at Our sole discretion.
        </Typography>
      </Paper>
    </Container>
  );
};

export default TermsAndConditions;
