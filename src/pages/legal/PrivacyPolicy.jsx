import React from 'react';
import { Box, Typography, Container, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
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
          Privacy Policy
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>

        <Typography variant="body1" paragraph sx={{ mt: 4 }}>
          Welcome to the School Management System. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 'bold' }}>
          1. Important information and who we are
        </Typography>
        <Typography variant="body1" paragraph>
          This privacy policy aims to give you information on how we collect and process your personal data through your use of this platform, including any data you may provide through this platform when you sign up or use our services.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 'bold' }}>
          2. The data we collect about you
        </Typography>
        <Typography variant="body1" paragraph>
          We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
        </Typography>
        <ul>
          <li><Typography variant="body1"><strong>Identity Data</strong> includes first name, maiden name, last name, username or similar identifier, title, date of birth and gender.</Typography></li>
          <li><Typography variant="body1"><strong>Contact Data</strong> includes billing address, delivery address, email address and telephone numbers.</Typography></li>
          <li><Typography variant="body1"><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</Typography></li>
        </ul>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 'bold' }}>
          3. How we use your personal data
        </Typography>
        <Typography variant="body1" paragraph>
          We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
        </Typography>
        <ul>
          <li><Typography variant="body1">Where we need to perform the contract we are about to enter into or have entered into with you.</Typography></li>
          <li><Typography variant="body1">Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</Typography></li>
          <li><Typography variant="body1">Where we need to comply with a legal obligation.</Typography></li>
        </ul>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 'bold' }}>
          4. Data security
        </Typography>
        <Typography variant="body1" paragraph>
          We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
        </Typography>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicy;
