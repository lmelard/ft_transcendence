// import { Box, Typography, Button } from '@mui/material';
// import { Link } from 'react-router-dom';

// function NotFound() {
//   const backgroundGif = 'https://media.giphy.com/media/COYGe9rZvfiaQ/giphy.gif';
// 	// const backgroundGif = 'https://media.giphy.com/media/YTzh3zw4mj1XpjjiIb/giphy.gif'
//   return (
//     <Box
//       sx={{
//         height: '90vh', 
//         // width: '100vw', 
//         backgroundImage: `url(${backgroundGif})`,
//         backgroundRepeat: 'no-repeat',
//         backgroundPosition: 'center center',
//         backgroundSize: 'cover', 
//         display: 'flex',
//         flexDirection: 'column',
//         justifyContent: 'center', 
//         alignItems: 'center', 
//         textAlign: 'center', 
//         color: 'white', 
// 		m: 0,
//         p: 0, 
// 		overflow: 'hidden',
//       }}
//     >
//       <Typography variant="h2" component="h1">
//         404
//       </Typography>
//       <Typography variant="h6">
//         There's nothing here.
//       </Typography>
//       <Button component={Link} to={'/'} variant="contained" color="primary" sx={{ mt: 2 }}>
//         Go to home
//       </Button>
//     </Box>
//   );
// }

// export default NotFound;

import { Box, Typography, Container, useTheme, useMediaQuery, Button } from '@mui/material';
import { Link } from 'react-router-dom';

function NotFound() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const gifUrl = 'https://media.giphy.com/media/YTzh3zw4mj1XpjjiIb/giphy.gif';

  return (
    <Container maxWidth="lg" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column-reverse' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: isMobile ? 'center' : 'left',
        }}
      >
        <Box sx={{ flex: isMobile ? '1 1 100%' : '1' }}>
		<Typography variant="h3" component="h1" color="textPrimary" gutterBottom>
            404 PAGE NOT FOUND
          </Typography>
          <Typography variant="subtitle1" color="textSecondary" paragraph>
		  There's nothing here.
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Check that you typed the address correctly, go back to your previous page or try to go home.
          </Typography>
		  <Button component={Link} to={'/'} variant="contained" color="primary" sx={{ mt: 2 }}>
				Go to home
			</Button>
        </Box>
        <Box
          component="img"
          src={gifUrl}
          sx={{
            maxWidth: '50%',
            height: 'auto',
            flex: isMobile ? '1 1 100%' : '1',
            mt: isMobile ? 4 : 0,
            ml: isMobile ? 0 : 4
          }}
        />
      </Box>
    </Container>
  );
}

export default NotFound;
