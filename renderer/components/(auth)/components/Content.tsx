import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded'
import ConstructionRoundedIcon from '@mui/icons-material/ConstructionRounded'
import SettingsSuggestRoundedIcon from '@mui/icons-material/SettingsSuggestRounded'
import ThumbUpAltRoundedIcon from '@mui/icons-material/ThumbUpAltRounded'

const items = [
  {
    icon: <SettingsSuggestRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Dukungan Teknis Aplikasi',
    description: 'Aplikasi Kami Mendukung 24/7 Kebutuhan Anda'
  },
  {
    icon: <ConstructionRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Offline & Cloud Support',
    description: 'Tidak Ada Internet, Tidak Masalah. Data Kamu Aman'
  },
  {
    icon: <ThumbUpAltRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Pengalaman Yang Menyenangkan',
    description: 'Kami Menyesuaikan Aplikasi Kami Untuk Mudah Dipahami & Digunakan'
  },
  {
    icon: <AutoFixHighRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Berfokus Kepada Inovasi & Teknologi',
    description: 'Solusi & Inovasi adalah Motto Kami Untuk Terus Sesuai Keinginan & Teknologi Terbaru'
  }
]

export default function Content() {

  return (
    <Stack sx={{ flexDirection: 'column', alignSelf: 'center', gap: 4, maxWidth: 450 }}>
      <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
        {/*<SitemarkIcon />*/}
      </Box>
      {items.map((item, index) => (
        <Stack key={index} direction="row" sx={{ gap: 2 }}>
          {item.icon}
          <div>
            <Typography
              gutterBottom
              sx={{ fontWeight: 'medium' }}
              onClick={(e) => {
                e.preventDefault()
              }}
            >
              {item.title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {item.description}
            </Typography>
          </div>
        </Stack>
      ))}
    </Stack>
  )
}
